const crypto = require('node:crypto');

const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');

function translateDbError(err) {
  console.error('[forum] Database error:', err);
  const code = err?.code || '';
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(code)) {
    throw new ApiError(503, 'Database unreachable. Please try again later.');
  }
  if (code === 'ER_NO_SUCH_TABLE') {
    throw new ApiError(503, 'Database table missing — run: npm run migrate');
  }
  throw err;
}

const forumService = {
  // ─── Posts ─────────────────────────────────────────────────────────────────

  async listPosts({ sort, page, limit, userId }) {
    const db = getPool();
    const offset = (page - 1) * limit;

    const orderBy = sort === 'top'
      ? 'score DESC, p.created_at DESC'
      : 'p.created_at DESC';

    const [rows] = await db
      .query(
        `SELECT
           p.id, p.title, p.body, p.created_at, p.updated_at,
           u.id AS author_id, u.username AS author_username, u.role AS author_role,
           (SELECT COALESCE(SUM(v.value), 0) FROM forum_votes v WHERE v.target_type = 'post' AND v.target_id = p.id) AS score,
           (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS comment_count,
           ${userId ? '(SELECT COALESCE(MAX(v2.value), 0) FROM forum_votes v2 WHERE v2.target_type = \'post\' AND v2.target_id = p.id AND v2.user_id = ?) AS my_vote,' : '0 AS my_vote,'}
           COUNT(*) OVER() AS total_count
         FROM forum_posts p
         JOIN users u ON u.id = p.author_id
         GROUP BY p.id, u.id
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        userId
          ? [userId, userId, limit, offset]
          : [limit, offset],
      )
      .catch(translateDbError);

    const total = rows[0]?.total_count ?? 0;
    const posts = rows.map(({ total_count, ...r }) => r);
    return { posts, total: Number(total), page, limit };
  },

  async getPost(postId, userId) {
    const db = getPool();

    const [rows] = await db
      .query(
        `SELECT
           p.id, p.title, p.body, p.created_at, p.updated_at,
           u.id AS author_id, u.username AS author_username, u.role AS author_role,
           COALESCE(SUM(v.value), 0) AS score,
           ${userId ? 'MAX(CASE WHEN v2.user_id = ? THEN v2.value ELSE 0 END) AS my_vote' : '0 AS my_vote'}
         FROM forum_posts p
         JOIN users u ON u.id = p.author_id
         LEFT JOIN forum_votes v  ON v.target_type = 'post' AND v.target_id = p.id
         ${userId ? 'LEFT JOIN forum_votes v2 ON v2.target_type = \'post\' AND v2.target_id = p.id AND v2.user_id = ?' : ''}
         WHERE p.id = ?
         GROUP BY p.id, u.id`,
        userId ? [userId, userId, postId] : [postId],
      )
      .catch(translateDbError);

    if (!rows[0]) throw new ApiError(404, 'Beitrag nicht gefunden.');

    // Fetch comments
    const [comments] = await db
      .query(
        `SELECT
           c.id, c.body, c.created_at, c.updated_at,
           u.id AS author_id, u.username AS author_username, u.role AS author_role,
           COALESCE(SUM(v.value), 0) AS score,
           ${userId ? 'MAX(CASE WHEN v2.user_id = ? THEN v2.value ELSE 0 END) AS my_vote' : '0 AS my_vote'}
         FROM forum_comments c
         JOIN users u ON u.id = c.author_id
         LEFT JOIN forum_votes v  ON v.target_type = 'comment' AND v.target_id = c.id
         ${userId ? 'LEFT JOIN forum_votes v2 ON v2.target_type = \'comment\' AND v2.target_id = c.id AND v2.user_id = ?' : ''}
         WHERE c.post_id = ?
         GROUP BY c.id, u.id
         ORDER BY c.created_at ASC`,
        userId ? [userId, userId, postId] : [postId],
      )
      .catch(translateDbError);

    return { ...rows[0], comments };
  },

  async createPost({ title, body, authorId }) {
    const db = getPool();
    const id = crypto.randomUUID();

    await db
      .query(
        'INSERT INTO forum_posts (id, author_id, title, body) VALUES (?, ?, ?, ?)',
        [id, authorId, title, body],
      )
      .catch(translateDbError);

    return this.getPost(id, authorId);
  },

  async updatePost({ postId, userId, role, title, body }) {
    const db = getPool();

    const [rows] = await db
      .query('SELECT author_id FROM forum_posts WHERE id = ? LIMIT 1', [postId])
      .catch(translateDbError);

    const post = rows[0];
    if (!post) throw new ApiError(404, 'Beitrag nicht gefunden.');

    const canEdit = post.author_id === userId || role === 'admin' || role === 'moderator';
    if (!canEdit) throw new ApiError(403, 'Keine Berechtigung diesen Beitrag zu bearbeiten.');

    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (body !== undefined)  { fields.push('body = ?');  values.push(body);  }
    values.push(postId);

    await db
      .query(`UPDATE forum_posts SET ${fields.join(', ')} WHERE id = ?`, values)
      .catch(translateDbError);

    return this.getPost(postId, userId);
  },

  async deletePost({ postId, userId, role }) {
    const db = getPool();

    const [rows] = await db
      .query('SELECT author_id FROM forum_posts WHERE id = ? LIMIT 1', [postId])
      .catch(translateDbError);

    const post = rows[0];
    if (!post) throw new ApiError(404, 'Beitrag nicht gefunden.');

    const canDelete = post.author_id === userId || role === 'admin' || role === 'moderator';
    if (!canDelete) throw new ApiError(403, 'Keine Berechtigung diesen Beitrag zu löschen.');

    await db.query('DELETE FROM forum_posts WHERE id = ?', [postId]).catch(translateDbError);
  },

  // ─── Comments ──────────────────────────────────────────────────────────────

  async createComment({ postId, body, authorId }) {
    const db = getPool();

    const [postRows] = await db
      .query('SELECT id FROM forum_posts WHERE id = ? LIMIT 1', [postId])
      .catch(translateDbError);
    if (!postRows[0]) throw new ApiError(404, 'Beitrag nicht gefunden.');

    const id = crypto.randomUUID();
    await db
      .query(
        'INSERT INTO forum_comments (id, post_id, author_id, body) VALUES (?, ?, ?, ?)',
        [id, postId, authorId, body],
      )
      .catch(translateDbError);

    const [rows] = await db
      .query(
        `SELECT c.id, c.body, c.created_at, c.updated_at,
                u.id AS author_id, u.username AS author_username, u.role AS author_role,
                0 AS score, 0 AS my_vote
         FROM forum_comments c JOIN users u ON u.id = c.author_id
         WHERE c.id = ?`,
        [id],
      )
      .catch(translateDbError);

    return rows[0];
  },

  async updateComment({ commentId, userId, role, body }) {
    const db = getPool();

    const [rows] = await db
      .query('SELECT author_id FROM forum_comments WHERE id = ? LIMIT 1', [commentId])
      .catch(translateDbError);

    const comment = rows[0];
    if (!comment) throw new ApiError(404, 'Kommentar nicht gefunden.');

    const canEdit = comment.author_id === userId || role === 'admin' || role === 'moderator';
    if (!canEdit) throw new ApiError(403, 'Keine Berechtigung diesen Kommentar zu bearbeiten.');

    await db
      .query('UPDATE forum_comments SET body = ? WHERE id = ?', [body, commentId])
      .catch(translateDbError);

    const [updated] = await db
      .query(
        `SELECT c.id, c.body, c.created_at, c.updated_at,
                u.id AS author_id, u.username AS author_username, u.role AS author_role,
                COALESCE(SUM(v.value), 0) AS score
         FROM forum_comments c
         JOIN users u ON u.id = c.author_id
         LEFT JOIN forum_votes v ON v.target_type = 'comment' AND v.target_id = c.id
         WHERE c.id = ?
         GROUP BY c.id, u.id`,
        [commentId],
      )
      .catch(translateDbError);

    return updated[0];
  },

  async deleteComment({ commentId, userId, role }) {
    const db = getPool();

    const [rows] = await db
      .query('SELECT author_id FROM forum_comments WHERE id = ? LIMIT 1', [commentId])
      .catch(translateDbError);

    const comment = rows[0];
    if (!comment) throw new ApiError(404, 'Kommentar nicht gefunden.');

    const canDelete = comment.author_id === userId || role === 'admin' || role === 'moderator';
    if (!canDelete) throw new ApiError(403, 'Keine Berechtigung diesen Kommentar zu löschen.');

    await db
      .query('DELETE FROM forum_comments WHERE id = ?', [commentId])
      .catch(translateDbError);
  },

  // ─── Votes ─────────────────────────────────────────────────────────────────

  async vote({ targetType, targetId, userId, value }) {
    const db = getPool();

    // Verify target exists
    const table = targetType === 'post' ? 'forum_posts' : 'forum_comments';
    const [target] = await db
      .query(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [targetId])
      .catch(translateDbError);
    if (!target[0]) throw new ApiError(404, `${targetType === 'post' ? 'Beitrag' : 'Kommentar'} nicht gefunden.`);

    if (value === 0) {
      await db
        .query(
          `DELETE FROM forum_votes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
          [userId, targetType, targetId],
        )
        .catch(translateDbError);
    } else {
      const id = crypto.randomUUID();
      await db
        .query(
          `INSERT INTO forum_votes (id, user_id, target_type, target_id, value)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE value = ?`,
          [id, userId, targetType, targetId, value, value],
        )
        .catch(translateDbError);
    }

    const [scoreRows] = await db
      .query(
        `SELECT COALESCE(SUM(value), 0) AS score FROM forum_votes
         WHERE target_type = ? AND target_id = ?`,
        [targetType, targetId],
      )
      .catch(translateDbError);

    return { score: Number(scoreRows[0].score), my_vote: value };
  },
};

module.exports = { forumService };
