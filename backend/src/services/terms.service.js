import { createCrudService } from "./crudFactory.js";

export const termsService = createCrudService({
  table: "terms",
  idColumn: "term_id",
  writableColumns: ["academic_year", "semester"],
  orderBy: "academic_year DESC, semester",
});
