const mongoose = require("mongoose");

const CompanyMigratedSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  contactPersonName: { type: String, required: true },
  contactPersonNumber: { type: String, required: true },
  contactPersonEmail: { type: String, required: true },
  comment: { type: String, default: "" },
  industry_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  migratedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CompanyMigrated", CompanyMigratedSchema, "companies_migrated");
