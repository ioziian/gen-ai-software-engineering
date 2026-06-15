import fs from "fs";
import path from "path";
import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../src/app";
import { ticketRepository } from "../src/repositories/ticketRepository";

const FIXTURES = path.join(__dirname, "fixtures");

const validTicket = {
    customer_id: "U001",
    customer_email: "user@example.com",
    customer_name: "Test User",
    subject: "Test ticket subject",
    description:
        "This is a detailed description of the test ticket that meets the minimum length",
};

beforeEach(() => ticketRepository.clear());

describe("Integration Tests", () => {
    it("full ticket lifecycle: create → get → update → delete → 404", async () => {
        const created = await request(app).post("/tickets").send(validTicket);
        expect(created.status).toBe(201);
        const id = created.body.id;

        const fetched = await request(app).get(`/tickets/${id}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.id).toBe(id);

        const updated = await request(app)
            .put(`/tickets/${id}`)
            .send({ ...validTicket, subject: "Updated Subject" });
        expect(updated.status).toBe(200);
        expect(updated.body.subject).toBe("Updated Subject");

        const deleted = await request(app).delete(`/tickets/${id}`);
        expect(deleted.status).toBe(204);

        const afterDelete = await request(app).get(`/tickets/${id}`);
        expect(afterDelete.status).toBe(404);
    });

    it("bulk CSV import: fixture uploads successfully and count increases", async () => {
        const csvBuffer = fs.readFileSync(
            path.join(FIXTURES, "sample_tickets_valid.csv"),
        );

        const importRes = await request(app)
            .post("/tickets/import")
            .attach("file", csvBuffer, {
                filename: "sample_tickets_valid.csv",
                contentType: "text/csv",
            });
        expect(importRes.status).toBe(207);
        expect(importRes.body.successful).toBeGreaterThan(0);

        const listRes = await request(app).get("/tickets");
        expect(listRes.status).toBe(200);
        expect(listRes.body.length).toBe(importRes.body.successful);
    });

    it("mixed import: invalid fixture returns both successful > 0 and failed > 0", async () => {
        const csvBuffer = fs.readFileSync(
            path.join(FIXTURES, "sample_tickets_invalid.csv"),
        );

        const res = await request(app)
            .post("/tickets/import")
            .attach("file", csvBuffer, {
                filename: "sample_tickets_invalid.csv",
                contentType: "text/csv",
            });
        expect(res.status).toBe(207);
        expect(res.body.successful).toBeGreaterThan(0);
        expect(res.body.failed).toBeGreaterThan(0);
    });

    it("auto-classify on create: GET ticket has non-null category and priority", async () => {
        const res = await request(app)
            .post("/tickets?auto_classify=true")
            .send({
                ...validTicket,
                subject: "Login failed",
                description: "Cannot access my account after password reset",
            });
        expect(res.status).toBe(201);
        const id = res.body.id;

        const fetched = await request(app).get(`/tickets/${id}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.category).not.toBeNull();
        expect(fetched.body.priority).not.toBeNull();
    });

    it("category filter returns only tickets of the requested category", async () => {
        const rows = [
            "customer_id,customer_email,customer_name,subject,description",
            "C001,user1@example.com,User One,Cannot login to account,I cannot access my account password reset failed",
            "C002,user2@example.com,User Two,Payment failed,My payment method was declined but I was still charged",
            "C003,user3@example.com,User Three,Cannot sign in,Authentication failed and account locked",
        ];
        const csvContent = rows.join("\n");

        await request(app)
            .post("/tickets/import")
            .set("Content-Type", "text/csv")
            .send(csvContent);

        const res = await request(app).get("/tickets?category=account_access");
        expect(res.status).toBe(200);
        console.log("Tickets in store:", ticketRepository.findAll({}));
        expect(res.body.length).toBeGreaterThan(0);
        res.body.forEach((ticket: any) =>
            expect(ticket.category).toBe("account_access"),
        );
    });

    it("combined filter by category and priority returns only matching tickets", async () => {
        await request(app)
            .post("/tickets")
            .send({
                ...validTicket,
                category: "billing_question",
                priority: "high",
            });
        await request(app)
            .post("/tickets")
            .send({
                ...validTicket,
                category: "billing_question",
                priority: "low",
            });
        await request(app)
            .post("/tickets")
            .send({ ...validTicket, category: "bug_report", priority: "high" });

        const res = await request(app).get(
            "/tickets?category=billing_question&priority=high",
        );
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        res.body.forEach((t: any) => {
            expect(t.category).toBe("billing_question");
            expect(t.priority).toBe("high");
        });
    });

    it("bulk import auto-classifies all imported tickets", async () => {
        const csvContent =
            "customer_id,customer_email,customer_name,subject,description\n" +
            "C001,user1@example.com,User One,Login failed,Cannot access my account after password reset attempt";

        const res = await request(app)
          .post('/tickets/import')
          .set('Content-Type', 'text/csv')
          .send(csvContent);

        expect(res.status).toBe(207);        expect(res.body.successful).toBe(1);
        const ticket = res.body.tickets[0];
        expect(ticket.category).toBe("account_access");
        expect(ticket.priority).toBeDefined();
        expect(ticket.classification).toBeDefined();
        expect(ticket.classification.confidence).toBeGreaterThan(0);
    });
});
