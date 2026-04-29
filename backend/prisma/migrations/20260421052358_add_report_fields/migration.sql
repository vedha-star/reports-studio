-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "columnMap" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "endpoint" VARCHAR(100),
ADD COLUMN     "scheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "reportName" VARCHAR(100) NOT NULL,
    "cron" VARCHAR(50) NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "time" VARCHAR(10) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL,
    "nextRun" TEXT,
    "lastRun" TEXT,
    "successRate" DOUBLE PRECISION DEFAULT 0,
    "totalRuns" INTEGER DEFAULT 0,
    "format" VARCHAR(20) NOT NULL,
    "delivery" VARCHAR(20) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunHistory" (
    "id" TEXT NOT NULL,
    "reportName" VARCHAR(100) NOT NULL,
    "scheduleId" VARCHAR(36),
    "status" VARCHAR(20) NOT NULL,
    "duration" INTEGER,
    "outputFormat" VARCHAR(20) NOT NULL,
    "errorMessage" TEXT,
    "trigger" VARCHAR(20) NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunHistory_pkey" PRIMARY KEY ("id")
);
