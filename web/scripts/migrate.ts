import { resolve } from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/db";

async function main() {
    console.log(`Applying drizzle migrations to local db...`);

    await migrate(db, {
        migrationsFolder: resolve(process.cwd(), "src/db"),
    });

    console.log("Migrations applied.");
}

main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
