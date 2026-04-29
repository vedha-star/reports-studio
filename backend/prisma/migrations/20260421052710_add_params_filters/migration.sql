-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "filters" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "parameters" JSONB NOT NULL DEFAULT '[]';
