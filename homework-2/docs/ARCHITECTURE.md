# Architecture

## Diagram
```mermaid
graph TD
    Client --> API[Express API]
    API --> Service[TicketService]
    Service --> Store[TicketStore]
    Service --> Classification[ClassificationService]
```
