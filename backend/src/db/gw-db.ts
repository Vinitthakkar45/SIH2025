import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./gw-schema";

const connectionString = "postgresql://postgres:postgres@localhost:5432/ingres";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
