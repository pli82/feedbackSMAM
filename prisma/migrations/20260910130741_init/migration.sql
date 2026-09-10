-- CreateTable
CREATE TABLE "Chestionar" (
    "id" TEXT NOT NULL,
    "versiuneCurs" TEXT NOT NULL DEFAULT 'v1',
    "formator" TEXT,
    "grupa" TEXT,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chestionar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntrebareLikert" (
    "id" SERIAL NOT NULL,
    "numar" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IntrebareLikert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaspunsLikert" (
    "id" TEXT NOT NULL,
    "chestionarId" TEXT NOT NULL,
    "intrebareId" INTEGER NOT NULL,
    "valoare" INTEGER NOT NULL,

    CONSTRAINT "RaspunsLikert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaspunsDeschis" (
    "id" TEXT NOT NULL,
    "chestionarId" TEXT NOT NULL,
    "numarIntrebare" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "RaspunsDeschis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chestionar_formator_idx" ON "Chestionar"("formator");

-- CreateIndex
CREATE INDEX "Chestionar_grupa_idx" ON "Chestionar"("grupa");

-- CreateIndex
CREATE UNIQUE INDEX "IntrebareLikert_numar_key" ON "IntrebareLikert"("numar");

-- CreateIndex
CREATE INDEX "RaspunsLikert_intrebareId_idx" ON "RaspunsLikert"("intrebareId");

-- CreateIndex
CREATE UNIQUE INDEX "RaspunsLikert_chestionarId_intrebareId_key" ON "RaspunsLikert"("chestionarId", "intrebareId");

-- CreateIndex
CREATE INDEX "RaspunsDeschis_numarIntrebare_idx" ON "RaspunsDeschis"("numarIntrebare");

-- AddForeignKey
ALTER TABLE "RaspunsLikert" ADD CONSTRAINT "RaspunsLikert_chestionarId_fkey" FOREIGN KEY ("chestionarId") REFERENCES "Chestionar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaspunsLikert" ADD CONSTRAINT "RaspunsLikert_intrebareId_fkey" FOREIGN KEY ("intrebareId") REFERENCES "IntrebareLikert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaspunsDeschis" ADD CONSTRAINT "RaspunsDeschis_chestionarId_fkey" FOREIGN KEY ("chestionarId") REFERENCES "Chestionar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
