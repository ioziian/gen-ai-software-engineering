import xml2js from "xml2js";

export async function parseXML(buffer: Buffer): Promise<any[]> {
    try {
        const text = buffer.toString("utf8");
        const result = await xml2js.parseStringPromise(text, {
            explicitArray: false,
            mergeAttrs: true,
        });

        if (!result.tickets) {
            throw new Error("XML must contain a <tickets> root element");
        }

        const ticketData = result.tickets.ticket;

        if (!ticketData) {
            return [];
        }

        const normalizeTags = (ticket: any) => {
            if (ticket.tags) {
                if (Array.isArray(ticket.tags.tag)) {
                    ticket.tags = ticket.tags.tag;
                } else if (typeof ticket.tags.tag === "string") {
                    ticket.tags = [ticket.tags.tag];
                } else {
                    ticket.tags = [];
                }
            } else {
                ticket.tags = [];
            }
            return ticket;
        };

        if (Array.isArray(ticketData)) {
            return ticketData.map(normalizeTags);
        }
        return [normalizeTags(ticketData)];
    } catch (err) {
        throw new Error(
            `Invalid XML: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
}
