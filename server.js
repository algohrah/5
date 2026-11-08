// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv2 from "dotenv";
import { createServer as createViteServer } from "vite";

// server/db.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
var pool = null;
var isDbConnected = false;
var dbError = null;
function getDbPool() {
  if (pool) return pool;
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "u125449775_tawafok_";
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || "u125449775_tawafok_";
  const port = Number(process.env.DB_PORT) || 3306;
  if (!password) {
    dbError = "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (DB_PASSWORD) \u0641\u064A \u0645\u0644\u0641 .env";
    return null;
  }
  try {
    pool = mysql.createPool({
      host,
      user,
      password: password || "",
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4_unicode_ci"
    });
    return pool;
  } catch (err) {
    dbError = err.message || "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0639 \u0627\u062A\u0635\u0627\u0644\u0627\u062A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A";
    console.error("[Database] Pool creation error:", err);
    return null;
  }
}
async function testDbConnection() {
  const currentPool = getDbPool();
  if (!currentPool) {
    return {
      connected: false,
      message: dbError || "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0643\u0648\u064A\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0639\u062F"
    };
  }
  try {
    const connection = await currentPool.getConnection();
    const [rows] = await connection.query("SELECT 1 + 1 AS test");
    const [tables] = await connection.query("SHOW TABLES");
    connection.release();
    isDbConnected = true;
    dbError = null;
    return {
      connected: true,
      message: "\u062A\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A MySQL \u0641\u064A Hostinger \u0628\u0646\u062C\u0627\u062D",
      details: {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        tablesCount: Array.isArray(tables) ? tables.length : 0
      }
    };
  } catch (error) {
    isDbConnected = false;
    dbError = error.message || "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0640 MySQL";
    console.error("[Database] Connection test failed:", error);
    return {
      connected: false,
      message: `\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ${error.message}`
    };
  }
}

// server.ts
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3e3;
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Tawafok Platform API",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });
  app.get("/api/db-status", async (_req, res) => {
    const status = await testDbConnection();
    res.json(status);
  });
  app.get("/api/plans", async (_req, res) => {
    const pool2 = getDbPool();
    if (!pool2) {
      return res.json({
        source: "default",
        plans: [
          { id: "free", name: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629", price: 0, currency: "QAR", period: "\u0644\u0644\u0623\u0628\u062F" },
          { id: "featured", name: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u0645\u064A\u0632\u0629", price: 99, currency: "QAR", period: "30 \u064A\u0648\u0645\u064B\u0627" }
        ]
      });
    }
    try {
      const [rows] = await pool2.query("SELECT * FROM `plans` WHERE `is_active` = 1");
      res.json({ source: "mysql", plans: rows });
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0628\u0627\u0642\u0627\u062A", message: err.message });
    }
  });
  app.get("/api/cities", async (_req, res) => {
    const pool2 = getDbPool();
    if (!pool2) {
      return res.json([
        { id: 1, country: "\u0642\u0637\u0631", name_ar: "\u0627\u0644\u062F\u0648\u062D\u0629" },
        { id: 2, country: "\u0642\u0637\u0631", name_ar: "\u0627\u0644\u0631\u064A\u0627\u0646" },
        { id: 3, country: "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629", name_ar: "\u0627\u0644\u0631\u064A\u0627\u0636" },
        { id: 4, country: "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629", name_ar: "\u062C\u062F\u0629" }
      ]);
    }
    try {
      const [rows] = await pool2.query("SELECT * FROM `cities` WHERE `is_active` = 1 ORDER BY `country`, `name_ar`");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062F\u0646", message: err.message });
    }
  });
  app.post("/api/cities", async (req, res) => {
    const { country, name_ar } = req.body || {};
    const pool2 = getDbPool();
    if (!pool2) return res.json({ success: true, localOnly: true });
    try {
      await pool2.query("INSERT INTO `cities` (`country`, `name_ar`, `is_active`) VALUES (?, ?, 1)", [country || "\u0642\u0637\u0631", name_ar || ""]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/settings", async (_req, res) => {
    const pool2 = getDbPool();
    if (!pool2) {
      return res.json({
        site_name: "\u062A\u0648\u0627\u0641\u0642 - \u0645\u0646\u0635\u0629 \u0648\u0633\u0627\u0637\u0629 \u0627\u0644\u0632\u0648\u0627\u062C \u0627\u0644\u0634\u0631\u0639\u064A",
        site_currency: "QAR",
        admin_whatsapp: "97455620331",
        journey_deposit_fee: "500",
        journey_final_fee: "2000"
      });
    }
    try {
      const [rows] = await pool2.query("SELECT `setting_key`, `setting_value` FROM `system_settings`");
      const settingsMap = {};
      if (Array.isArray(rows)) {
        rows.forEach((r) => {
          settingsMap[r.setting_key] = r.setting_value;
        });
      }
      res.json(settingsMap);
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", message: err.message });
    }
  });
  app.post("/api/settings", async (req, res) => {
    const pool2 = getDbPool();
    if (!pool2) return res.json({ success: true, localOnly: true });
    const settings = req.body || {};
    try {
      for (const [key, val] of Object.entries(settings)) {
        if (typeof key === "string" && val !== void 0) {
          const stringVal = typeof val === "object" ? JSON.stringify(val) : String(val);
          await pool2.query(
            "INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`)",
            [key, stringVal]
          );
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/members", async (req, res) => {
    const pool2 = getDbPool();
    if (!pool2) {
      return res.status(200).json({
        source: "local_storage_fallback",
        message: "\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062F\u0627\u0631\u0629 \u063A\u064A\u0631 \u0645\u0641\u0639\u0644\u0629\u060C \u064A\u0639\u0645\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062D\u0644\u064A",
        members: []
      });
    }
    try {
      const { gender, country, city, is_verified, is_featured, include_inactive, limit = "2000" } = req.query;
      let query = "SELECT * FROM `members`";
      const whereClauses = [];
      const params = [];
      if (include_inactive !== "true" && include_inactive !== "1") {
        whereClauses.push("`is_active` = 1");
      }
      if (gender) {
        whereClauses.push("`gender` = ?");
        params.push(gender);
      }
      if (country) {
        whereClauses.push("`country` = ?");
        params.push(country);
      }
      if (city) {
        whereClauses.push("`city` = ?");
        params.push(city);
      }
      if (is_verified !== void 0) {
        whereClauses.push("`is_verified` = ?");
        params.push(is_verified === "true" || is_verified === "1" ? 1 : 0);
      }
      if (is_featured !== void 0) {
        whereClauses.push("`is_featured` = ?");
        params.push(is_featured === "true" || is_featured === "1" ? 1 : 0);
      }
      if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
      }
      query += " ORDER BY `is_featured` DESC, `id` DESC LIMIT ?";
      params.push(Math.min(Number(limit) || 2e3, 5e3));
      const [rows] = await pool2.query(query, params);
      res.json({ source: "mysql", count: rows.length, members: rows });
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0639\u0636\u0627\u0621", message: err.message });
    }
  });
  const handleBulkMembersImport = async (req, res) => {
    const pool2 = getDbPool();
    const rawList = req.body?.bulk || req.body?.members || (Array.isArray(req.body) ? req.body : req.body ? [req.body] : []);
    const membersList = Array.isArray(rawList) ? rawList : [];
    if (membersList.length === 0) {
      return res.status(400).json({ success: false, error: "\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0641\u0627\u0631\u063A\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    }
    if (!pool2) {
      return res.json({
        success: true,
        source: "local_mode",
        savedCount: membersList.length,
        message: "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638 \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0645\u062D\u0644\u064A"
      });
    }
    try {
      let insertedCount = 0;
      for (const m of membersList) {
        const memberCode = m.memberCode || m.member_code || `TW-${Math.floor(1e3 + Math.random() * 9e4)}`;
        const email = m.email || `${memberCode.toLowerCase()}@tawafok.com`;
        const fullName = m.nickname || m.full_name || m.name || m.realName || "\u0639\u0636\u0648 \u0645\u0633\u062A\u0648\u0631\u062F";
        const gender = m.gender === "female" ? "female" : "male";
        const country = m.country || "\u0642\u0637\u0631";
        const city = m.city || "\u0627\u0644\u062F\u0648\u062D\u0629";
        const nationality = m.nationality || country;
        const age = Number(m.age) || 28;
        const maritalStatus = m.maritalStatus || m.marital_status || "single";
        const marriageType = m.marriageType || m.marriage_type || "\u0632\u0648\u0627\u062C \u0645\u0639\u0644\u0646";
        const bio = m.bio || "";
        const partnerRequirements = m.aboutPartner || m.partner_requirements || "";
        const phone = m.phone || null;
        const sourceType = m.sourceType || "imported";
        const planId = m.plan || m.plan_id || "free";
        const isVerified = m.verified || m.is_verified ? 1 : 0;
        const isFeatured = m.premium || m.is_featured ? 1 : 0;
        const isActive = m.status === "suspended" ? 0 : 1;
        const insertQuery = `
          INSERT INTO \`members\` (
            \`member_code\`, \`email\`, \`password_hash\`, \`full_name\`, \`phone\`,
            \`gender\`, \`nationality\`, \`country\`, \`city\`, \`age\`,
            \`marital_status\`, \`marriage_type\`, \`bio\`, \`partner_requirements\`,
            \`plan_id\`, \`is_verified\`, \`is_featured\`, \`is_active\`, \`source_type\`
          ) VALUES (?, ?, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`full_name\` = VALUES(\`full_name\`),
            \`phone\` = VALUES(\`phone\`),
            \`city\` = VALUES(\`city\`),
            \`country\` = VALUES(\`country\`),
            \`age\` = VALUES(\`age\`),
            \`marital_status\` = VALUES(\`marital_status\`),
            \`bio\` = VALUES(\`bio\`),
            \`partner_requirements\` = VALUES(\`partner_requirements\`),
            \`is_active\` = VALUES(\`is_active\`),
            \`is_verified\` = VALUES(\`is_verified\`),
            \`is_featured\` = VALUES(\`is_featured\`)
        `;
        await pool2.query(insertQuery, [
          memberCode,
          email,
          fullName,
          phone,
          gender,
          nationality,
          country,
          city,
          age,
          maritalStatus,
          marriageType,
          bio,
          partnerRequirements,
          planId,
          isVerified,
          isFeatured,
          isActive,
          sourceType
        ]);
        insertedCount++;
      }
      res.json({
        success: true,
        source: "mysql",
        savedCount: insertedCount,
        message: `\u062A\u0645 \u062D\u0641\u0638 ${insertedCount} \u0639\u0636\u0648\u0627\u064B \u0628\u0634\u0643\u0644 \u062F\u0627\u0626\u0645 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Hostinger MySQL`
      });
    } catch (err) {
      console.error("[MySQL Batch Import Error]:", err);
      res.status(500).json({ success: false, error: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0641\u064A MySQL", message: err.message });
    }
  };
  app.post("/api/members/batch", handleBulkMembersImport);
  app.post("/api/members", handleBulkMembersImport);
  const handleUpdateMember = async (req, res) => {
    const updates = req.body || {};
    const memberId = req.params.id || updates.id || updates.memberId || updates.member_code;
    const pool2 = getDbPool();
    if (!memberId) {
      return res.status(400).json({ success: false, error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0639\u0636\u0648 (id) \u0645\u0637\u0644\u0648\u0628 \u0644\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    }
    if (!pool2) return res.json({ success: true, localOnly: true, message: "\u062A\u0645 \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u0645\u062D\u0644\u064A\u0627\u064B" });
    try {
      const allowedFields = {
        full_name: "full_name",
        fullName: "full_name",
        name: "full_name",
        real_name: "real_name",
        realName: "real_name",
        nickname: "nickname",
        phone: "phone",
        whatsapp: "whatsapp",
        gender: "gender",
        country: "country",
        city: "city",
        district: "district",
        nationality: "nationality",
        tribe: "tribe",
        ethnicity: "ethnicity",
        ethnicity_other: "ethnicity_other",
        ethnicityOther: "ethnicity_other",
        age: "age",
        height: "height",
        weight: "weight",
        skin_color: "skin_color",
        skinColor: "skin_color",
        health: "health",
        smoking: "smoking",
        education: "education",
        work_type: "work_type",
        workType: "work_type",
        occupation: "occupation",
        job_title: "occupation",
        jobTitle: "occupation",
        financial_status: "financial_status",
        marital_status: "marital_status",
        maritalStatus: "marital_status",
        children_count: "children_count",
        childrenCount: "children_count",
        housing_type: "housing_type",
        housing: "housing_type",
        sect: "sect",
        prayer_commitment: "prayer_commitment",
        marriage_type: "marriage_type",
        marriageType: "marriage_type",
        accepts_polygamy: "accepts_polygamy",
        acceptPolygamy: "accepts_polygamy",
        bio: "bio",
        partner_requirements: "partner_requirements",
        aboutPartner: "partner_requirements",
        partner_specifications: "partner_specifications",
        partnerSpecifications: "partner_specifications",
        details: "details",
        plan_id: "plan_id",
        plan: "plan_id",
        is_verified: "is_verified",
        verified: "is_verified",
        is_featured: "is_featured",
        premium: "is_featured",
        is_active: "is_active",
        status: "is_active"
      };
      const partnerFields = {};
      const partnerKeys = [
        "pCountry",
        "pCity",
        "pAgeMin",
        "pAgeMax",
        "pNationality",
        "pMaritalStatus",
        "pAcceptChildren",
        "pNotes",
        "pSkinColor",
        "pSect",
        "pEducation",
        "pWorkType",
        "pHousing"
      ];
      for (const pk of partnerKeys) {
        if (updates[pk] !== void 0) {
          partnerFields[pk] = updates[pk];
        }
      }
      const setClauses = [];
      const params = [];
      for (const [key, val] of Object.entries(updates)) {
        if (key === "id" || key === "memberId" || key === "_authToken") continue;
        const col = allowedFields[key];
        if (col && val !== void 0) {
          if (!setClauses.some((c) => c.startsWith(`\`${col}\``))) {
            setClauses.push(`\`${col}\` = ?`);
            if (col === "is_active") {
              params.push(val === "active" || val === true || val === 1 ? 1 : 0);
            } else if (col === "is_verified" || col === "is_featured") {
              params.push(val === true || val === 1 ? 1 : 0);
            } else {
              params.push(val);
            }
          }
        }
      }
      if (Object.keys(partnerFields).length > 0 && !setClauses.some((c) => c.startsWith("`details`"))) {
        setClauses.push("`details` = ?");
        params.push(JSON.stringify(partnerFields));
      }
      if (setClauses.length === 0) {
        return res.json({ success: true, message: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0642\u0648\u0644 \u0644\u0644\u062A\u062D\u062F\u064A\u062B" });
      }
      let whereQuery = "WHERE `id` = ?";
      params.push(memberId);
      if (isNaN(Number(memberId))) {
        whereQuery = "WHERE `member_code` = ? OR `email` = ?";
        params.pop();
        params.push(memberId, memberId);
      }
      await pool2.query(`UPDATE \`members\` SET ${setClauses.join(", ")} ${whereQuery}`, params);
      res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0639\u0636\u0648 \u0641\u064A Hostinger MySQL \u0628\u0646\u062C\u0627\u062D" });
    } catch (err) {
      console.error("[Update Member Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  };
  app.put("/api/members/:id", handleUpdateMember);
  app.put("/api/members", handleUpdateMember);
  app.delete("/api/members/:id", async (req, res) => {
    const memberId = req.params.id;
    const pool2 = getDbPool();
    if (!pool2) return res.json({ success: true, localOnly: true });
    try {
      if (isNaN(Number(memberId))) {
        await pool2.query("DELETE FROM `members` WHERE `member_code` = ? OR `email` = ?", [memberId, memberId]);
      } else {
        await pool2.query("DELETE FROM `members` WHERE `id` = ?", [Number(memberId)]);
      }
      res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0639\u0636\u0648 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/members/bulk-action", async (req, res) => {
    const { ids, action, plan, status } = req.body || {};
    const pool2 = getDbPool();
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u062D\u062F\u064A\u062F \u0623\u064A \u0623\u0639\u0636\u0627\u0621" });
    }
    if (!pool2) return res.json({ success: true, localOnly: true });
    try {
      const placeholders = ids.map(() => "?").join(",");
      if (action === "delete") {
        await pool2.query(`DELETE FROM \`members\` WHERE \`id\` IN (${placeholders}) OR \`member_code\` IN (${placeholders})`, [...ids, ...ids]);
      } else if (action === "verify") {
        await pool2.query(`UPDATE \`members\` SET \`is_verified\` = 1 WHERE \`id\` IN (${placeholders}) OR \`member_code\` IN (${placeholders})`, [...ids, ...ids]);
      } else if (action === "unverify") {
        await pool2.query(`UPDATE \`members\` SET \`is_verified\` = 0 WHERE \`id\` IN (${placeholders}) OR \`member_code\` IN (${placeholders})`, [...ids, ...ids]);
      } else if (action === "feature") {
        await pool2.query(`UPDATE \`members\` SET \`is_featured\` = 1 WHERE \`id\` IN (${placeholders}) OR \`member_code\` IN (${placeholders})`, [...ids, ...ids]);
      } else if (action === "set_plan") {
        await pool2.query(`UPDATE \`members\` SET \`plan_id\` = ? WHERE \`id\` IN (${placeholders}) OR \`member_code\` IN (${placeholders})`, [plan || "free", ...ids, ...ids]);
      } else if (action === "update_status") {
        const isActive = status === "active" ? 1 : 0;
        await pool2.query(`UPDATE \`members\` SET \`is_active\` = ? WHERE \`id\` IN (${placeholders}) OR \`member_code\` IN (${placeholders})`, [isActive, ...ids, ...ids]);
      }
      res.json({ success: true, affectedCount: ids.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const pool2 = getDbPool();
    if (!pool2) {
      return res.json({
        success: true,
        source: "local_mode",
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062D\u0644\u064A \u0644\u0639\u062F\u0645 \u0627\u062A\u0635\u0627\u0644 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A"
      });
    }
    try {
      const cleanEmail = email.trim().toLowerCase();
      const [admins] = await pool2.query('SELECT * FROM `admins` WHERE LOWER(`email`) = ? AND `status` = "active"', [cleanEmail]);
      if (Array.isArray(admins) && admins.length > 0) {
        const admin = admins[0];
        if (admin.password_hash) {
          const passMatch = admin.password_hash === password || admin.password_hash === password.trim();
          if (!passMatch) {
            return res.status(401).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
          }
        }
        return res.json({
          success: true,
          role: "admin",
          user: {
            id: String(admin.id),
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role
          }
        });
      }
      const [members] = await pool2.query("SELECT * FROM `members` WHERE LOWER(`email`) = ? AND `is_active` = 1", [cleanEmail]);
      if (Array.isArray(members) && members.length > 0) {
        const member = members[0];
        if (member.password_hash && member.password_hash !== "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
          const passMatch = member.password_hash === password || member.password_hash === password.trim();
          if (!passMatch) {
            return res.status(401).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
          }
        }
        return res.json({
          success: true,
          role: "member",
          user: {
            id: String(member.id),
            member_code: member.member_code,
            memberCode: member.member_code,
            email: member.email,
            full_name: member.full_name,
            name: member.full_name,
            nickname: member.nickname || member.full_name || (member.gender === "female" ? "\u0639\u0636\u0648\u0629" : "\u0639\u0636\u0648"),
            real_name: member.real_name || member.full_name,
            realName: member.real_name || member.full_name,
            gender: member.gender,
            age: Number(member.age) || 25,
            country: member.country || "\u0642\u0637\u0631",
            city: member.city || "\u0627\u0644\u062F\u0648\u062D\u0629",
            district: member.district || "",
            tribe: member.tribe || "",
            ethnicity: member.ethnicity || "",
            ethnicityOther: member.ethnicity_other || "",
            height: Number(member.height) || 170,
            weight: Number(member.weight) || 70,
            skinColor: member.skin_color || "\u062D\u0646\u0637\u064A",
            health: member.health || "",
            smoking: member.smoking || "no",
            education: member.education || "",
            workType: member.work_type || "",
            jobTitle: member.occupation || "",
            housing: member.housing_type || "",
            phone: member.phone || "",
            whatsapp: member.whatsapp || member.phone || "",
            bio: member.bio || "",
            aboutPartner: member.partner_requirements || "",
            partner_specifications: member.partner_specifications || "",
            details: member.details || null,
            plan_id: member.plan_id || "free",
            plan: member.plan_id || "free",
            is_verified: Boolean(member.is_verified),
            verified: Boolean(member.is_verified),
            is_featured: Boolean(member.is_featured),
            premium: Boolean(member.is_featured)
          }
        });
      }
      return res.status(401).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    } catch (err) {
      console.error("[Login Error]:", err);
      res.status(500).json({ success: false, error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644", message: err.message });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    const body = req.body || {};
    const {
      email,
      password,
      fullName,
      nickname,
      phone,
      whatsapp,
      gender,
      nationality = "\u0642\u0637\u0631\u064A",
      country = "\u0642\u0637\u0631",
      city = "\u0627\u0644\u062F\u0648\u062D\u0629",
      district = "",
      tribe = "",
      ethnicity = "",
      ethnicityOther = "",
      age = 25,
      height = 0,
      weight = 0,
      skinColor = "",
      health = "",
      smoking = "no",
      education = "",
      workType = "",
      jobTitle = "",
      housing = "",
      maritalStatus = "single",
      marriageType = "\u0632\u0648\u0627\u062C \u0645\u0639\u0644\u0646",
      bio,
      partnerRequirements,
      details
    } = body;
    if (!email || !password || !fullName || !gender) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629" });
    }
    const pool2 = getDbPool();
    if (!pool2) {
      return res.json({
        success: true,
        source: "local_mode",
        message: "\u062A\u0645 \u0627\u0644\u062D\u0641\u0638 \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0645\u062D\u0644\u064A \u0644\u0639\u062F\u0645 \u0627\u062A\u0635\u0627\u0644 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629"
      });
    }
    try {
      const cleanEmail = email.trim().toLowerCase();
      const [existing] = await pool2.query("SELECT `id` FROM `members` WHERE LOWER(`email`) = ?", [cleanEmail]);
      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(409).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      const finalNickname = nickname && String(nickname).trim() ? String(nickname).trim() : gender === "female" ? "\u0639\u0636\u0648\u0629" : "\u0639\u0636\u0648";
      const memberCode = `TW-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const query = `
        INSERT INTO \`members\` (
          \`member_code\`, \`email\`, \`password_hash\`, \`full_name\`, \`nickname\`, \`real_name\`,
          \`phone\`, \`whatsapp\`, \`gender\`, \`nationality\`, \`country\`, \`city\`, \`district\`,
          \`tribe\`, \`ethnicity\`, \`ethnicity_other\`, \`age\`, \`height\`, \`weight\`, \`skin_color\`,
          \`health\`, \`smoking\`, \`education\`, \`work_type\`, \`occupation\`, \`housing_type\`,
          \`marital_status\`, \`marriage_type\`, \`bio\`, \`partner_requirements\`, \`details\`,
          \`plan_id\`, \`is_verified\`, \`is_active\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'free', 0, 1)
      `;
      const [result] = await pool2.query(query, [
        memberCode,
        cleanEmail,
        password,
        fullName,
        finalNickname,
        fullName,
        phone || null,
        whatsapp || phone || null,
        gender,
        nationality,
        country,
        city,
        district || null,
        tribe || null,
        ethnicity || null,
        ethnicityOther || null,
        Number(age) || 25,
        Number(height) || null,
        Number(weight) || null,
        skinColor || null,
        health || null,
        smoking || "no",
        education || null,
        workType || null,
        jobTitle || null,
        housing || null,
        maritalStatus,
        marriageType,
        bio || null,
        partnerRequirements || null,
        details ? typeof details === "object" ? JSON.stringify(details) : String(details) : null
      ]);
      res.status(201).json({
        success: true,
        message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0639\u0636\u0648 \u0648\u062D\u0641\u0638\u0647 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Hostinger \u0628\u0646\u062C\u0627\u062D",
        memberId: result.insertId,
        memberCode,
        nickname: finalNickname
      });
    } catch (err) {
      console.error("[Register Error]:", err);
      res.status(500).json({ success: false, error: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0639\u0636\u0648 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", message: err.message });
    }
  });
  app.get("/api/requests", async (_req, res) => {
    const pool2 = getDbPool();
    if (!pool2) return res.json({ source: "local", requests: [] });
    try {
      const [rows] = await pool2.query("SELECT * FROM `requests` ORDER BY `id` DESC");
      res.json({ source: "mysql", requests: rows || [] });
    } catch (err) {
      res.json({ source: "fallback", requests: [], error: err.message });
    }
  });
  app.post("/api/requests", async (req, res) => {
    const pool2 = getDbPool();
    const data = req.body || {};
    if (!pool2) return res.json({ success: true, localOnly: true });
    try {
      const query = `
        INSERT INTO \`requests\` (
          \`request_code\`, \`sender_id\`, \`receiver_id\`, \`status\`, \`stage\`,
          \`total_fee\`, \`deposit_amount\`, \`sender_paid_amount\`, \`receiver_paid_amount\`,
          \`sender_paid\`, \`receiver_paid\`, \`sender_exempted\`, \`receiver_exempted\`, \`admin_notes\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const requestCode = data.requestCode || `REQ-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const [result] = await pool2.query(query, [
        requestCode,
        String(data.senderId || data.sender_id || ""),
        String(data.receiverId || data.receiver_id || ""),
        data.status || "pending",
        data.stage || "sent",
        Number(data.totalFee || data.total_fee) || 5e3,
        Number(data.depositAmount || data.deposit_amount) || 1e3,
        Number(data.senderPaidAmount || data.sender_paid_amount) || 0,
        Number(data.receiverPaidAmount || data.receiver_paid_amount) || 0,
        data.senderPaid ? 1 : 0,
        data.receiverPaid ? 1 : 0,
        data.senderExempted ? 1 : 0,
        data.receiverExempted ? 1 : 0,
        data.adminNotes || null
      ]);
      res.json({ success: true, id: result.insertId, requestCode });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.put("/api/requests/:id/payments", async (req, res) => {
    const pool2 = getDbPool();
    const id = req.params.id;
    const {
      sender_paid_amount,
      receiver_paid_amount,
      sender_paid,
      receiver_paid,
      sender_exempted,
      receiver_exempted,
      status,
      stage,
      total_fee
    } = req.body || {};
    if (!pool2) return res.json({ success: true, localOnly: true });
    try {
      const setClauses = [];
      const params = [];
      if (sender_paid_amount !== void 0) {
        setClauses.push("`sender_paid_amount` = ?");
        params.push(Number(sender_paid_amount) || 0);
      }
      if (receiver_paid_amount !== void 0) {
        setClauses.push("`receiver_paid_amount` = ?");
        params.push(Number(receiver_paid_amount) || 0);
      }
      if (sender_paid !== void 0) {
        setClauses.push("`sender_paid` = ?");
        params.push(sender_paid ? 1 : 0);
      }
      if (receiver_paid !== void 0) {
        setClauses.push("`receiver_paid` = ?");
        params.push(receiver_paid ? 1 : 0);
      }
      if (sender_exempted !== void 0) {
        setClauses.push("`sender_exempted` = ?");
        params.push(sender_exempted ? 1 : 0);
      }
      if (receiver_exempted !== void 0) {
        setClauses.push("`receiver_exempted` = ?");
        params.push(receiver_exempted ? 1 : 0);
      }
      if (status !== void 0) {
        setClauses.push("`status` = ?");
        params.push(status);
      }
      if (stage !== void 0) {
        setClauses.push("`stage` = ?");
        params.push(stage);
      }
      if (total_fee !== void 0) {
        setClauses.push("`total_fee` = ?");
        params.push(Number(total_fee) || 5e3);
      }
      if (setClauses.length === 0) return res.json({ success: true, message: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0642\u0648\u0644 \u0644\u0644\u062A\u062D\u062F\u064A\u062B" });
      params.push(id);
      await pool2.query(`UPDATE \`requests\` SET ${setClauses.join(", ")} WHERE \`id\` = ? OR \`request_code\` = ?`, [...params, id]);
      res.json({ success: true, message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u0644\u0637\u0644\u0628 \u0641\u064A Hostinger MySQL \u0628\u0646\u062C\u0627\u062D" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/financials", async (_req, res) => {
    const pool2 = getDbPool();
    if (!pool2) {
      return res.json({
        totalDeposits: 0,
        totalRemaining: 0,
        totalExempted: 0,
        packageRevenue: 0
      });
    }
    try {
      const [reqStats] = await pool2.query(`
        SELECT
          COALESCE(SUM(sender_paid_amount + receiver_paid_amount), 0) AS total_collected,
          COALESCE(SUM(CASE WHEN (total_fee - sender_paid_amount - receiver_paid_amount) > 0 THEN (total_fee - sender_paid_amount - receiver_paid_amount) ELSE 0 END), 0) AS total_remaining,
          COALESCE(SUM(CASE WHEN sender_exempted = 1 THEN 1 ELSE 0 END + CASE WHEN receiver_exempted = 1 THEN 1 ELSE 0 END), 0) AS total_exempted
        FROM \`requests\`
      `);
      const [memberStats] = await pool2.query(`
        SELECT COUNT(*) AS featured_count FROM \`members\` WHERE \`plan_id\` = 'featured'
      `);
      const featuredCount = memberStats?.[0]?.featured_count || 0;
      res.json({
        totalDeposits: Number(reqStats?.[0]?.total_collected) || 0,
        totalRemaining: Number(reqStats?.[0]?.total_remaining) || 0,
        totalExempted: Number(reqStats?.[0]?.total_exempted) || 0,
        packageRevenue: featuredCount * 99
      });
    } catch (err) {
      res.json({ totalDeposits: 0, totalRemaining: 0, totalExempted: 0, packageRevenue: 0 });
    }
  });
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Tawafok Server] running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
