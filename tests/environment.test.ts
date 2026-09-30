import { describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { localDemo } from "../src/db";
import { GET as getData } from "../src/app/api/data/route";
import { GET as getPdf } from "../src/app/api/quotes/[id]/pdf/route";
describe("Protección en producción",()=>{
 it("no activa el modo local ni entrega datos o PDF sin sesión",async()=>{
  vi.stubEnv("NODE_ENV","production");vi.stubEnv("LOCAL_DEMO","true");vi.stubEnv("DATABASE_URL","");vi.stubEnv("BETTER_AUTH_SECRET","");
  try{expect(localDemo()).toBe(false);expect((await getData(new Request("http://localhost:3000/api/data"))).status).toBe(401);expect((await getPdf(new Request("http://localhost:3000/api/quotes/test/pdf"),{params:Promise.resolve({id:crypto.randomUUID()})})).status).toBe(401);}finally{vi.unstubAllEnvs();}
 });
});
