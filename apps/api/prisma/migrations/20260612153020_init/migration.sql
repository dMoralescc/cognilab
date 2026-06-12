-- CreateEnum
CREATE TYPE "CognitiveArea" AS ENUM ('ATTENTION', 'MEMORY', 'EXECUTIVE_FUNCTIONS', 'LANGUAGE', 'VISUOSPATIAL', 'ORIENTATION', 'SOCIAL_COGNITION');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('CANCELLATION', 'VISUAL_SEARCH', 'GO_NO_GO', 'DIVIDED_ATTENTION', 'ALTERNATING_ATTENTION', 'ATTENTION_SPAN', 'REACTION_TIME', 'VIGILANCE', 'AUDITORY_ATTENTION', 'VISUAL_TRACKING', 'DIGIT_SPAN', 'IMAGE_PAIRS', 'POSITION_SEQUENCES', 'FACE_MEMORY', 'WORD_MEMORY', 'STORY_MEMORY', 'PROSPECTIVE_MEMORY', 'SEMANTIC_MEMORY', 'VISUAL_RECOGNITION', 'SPATIAL_WORKING_MEMORY', 'EPISODIC_MEMORY', 'VISUOSPATIAL_SPAN', 'STROOP', 'TRAIL_MAKING', 'TOWER_OF_HANOI', 'ROUTE_PLANNING', 'INHIBITION', 'COGNITIVE_FLEXIBILITY', 'ABSTRACT_REASONING', 'CATEGORIZATION', 'PROBLEM_SOLVING', 'DESIGN_FLUENCY', 'N_BACK', 'DUAL_TASK', 'PHONOLOGICAL_FLUENCY', 'SEMANTIC_FLUENCY', 'NAMING', 'COMPREHENSION', 'REPETITION', 'READING', 'WRITING', 'PROSODY', 'MENTAL_ROTATION', 'FIGURE_COPY', 'PUZZLE', 'MAZE', 'DEPTH_PERCEPTION', 'OBJECT_ASSEMBLY', 'SHAPE_DISCRIMINATION', 'LINE_ORIENTATION', 'TEMPORAL_ORIENTATION', 'SPATIAL_ORIENTATION', 'PERSONAL_ORIENTATION', 'SITUATIONAL_ORIENTATION', 'EMOTION_RECOGNITION', 'THEORY_OF_MIND', 'EMPATHY', 'PERSPECTIVE_TAKING', 'MORAL_COGNITION', 'NONVERBAL_COMMUNICATION');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "diagnosis" TEXT,
    "notes" TEXT,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cognitiveArea" "CognitiveArea" NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "minLevel" INTEGER NOT NULL DEFAULT 1,
    "maxLevel" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "sessionItemId" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "reactionTimeMs" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_verificationToken_key" ON "Professional"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Result_sessionItemId_key" ON "Result"("sessionItemId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sessionItemId_fkey" FOREIGN KEY ("sessionItemId") REFERENCES "SessionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
