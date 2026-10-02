-- CreateTable
CREATE TABLE "IntrebareTest" (
    "id" SERIAL NOT NULL,
    "numar" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "optiuneA" TEXT NOT NULL,
    "optiuneB" TEXT NOT NULL,
    "optiuneC" TEXT NOT NULL,
    "optiuneD" TEXT NOT NULL,
    "raspunsCorect" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IntrebareTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaspunsTest" (
    "id" TEXT NOT NULL,
    "chestionarId" TEXT NOT NULL,
    "intrebareId" INTEGER NOT NULL,
    "varianta" TEXT NOT NULL,

    CONSTRAINT "RaspunsTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntrebareTest_numar_key" ON "IntrebareTest"("numar");

-- CreateIndex
CREATE INDEX "RaspunsTest_intrebareId_idx" ON "RaspunsTest"("intrebareId");

-- CreateIndex
CREATE UNIQUE INDEX "RaspunsTest_chestionarId_intrebareId_key" ON "RaspunsTest"("chestionarId", "intrebareId");

-- AddForeignKey
ALTER TABLE "RaspunsTest" ADD CONSTRAINT "RaspunsTest_chestionarId_fkey" FOREIGN KEY ("chestionarId") REFERENCES "Chestionar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaspunsTest" ADD CONSTRAINT "RaspunsTest_intrebareId_fkey" FOREIGN KEY ("intrebareId") REFERENCES "IntrebareTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
