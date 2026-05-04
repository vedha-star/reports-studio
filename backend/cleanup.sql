DELETE FROM "Category" WHERE "createdBy" IS NULL OR "createdBy" = '';
DELETE FROM "Report" WHERE "authorId" IS NULL OR "authorId" = '';
