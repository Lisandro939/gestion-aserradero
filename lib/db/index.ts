import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Crear cliente de Turso
const client = createClient({
	url: 'libsql://gestion-aserradero-lisandro939.aws-us-east-2.turso.io',
	authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzA2NzQyMzksImlkIjoiMDg0YzUxZGQtNTZlMS00NzQxLTlkMDktNjYzZTRlZmRjNTUzIiwicmlkIjoiMDAyYTg0YmUtNTE4OS00NmQxLTg2MGUtNDc5NzAwNTQ0NzNlIn0.VSC3ZEzmYZHb72T5l6TSAUXB0ss7dME2Mi6bSpq6hLwqgSYlD_6-C2F_uoVplh66ZazS2Xqj9rfchmj_1LqFAw',
});

// Crear instancia de Drizzle
export const db = drizzle(client, { schema });
