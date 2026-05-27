DROP INDEX "User_username_key";
ALTER TABLE "User" RENAME COLUMN "username" TO "fullName";
