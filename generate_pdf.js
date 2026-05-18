import fs from 'fs';
import { execSync } from 'child_process';

const classDiagram = `classDiagram
    class User {
        -String id
        -String name
        -String email
        -String phone
        -String password
        -Float walletBalance
        -String role
        -Boolean isVerified
        +register()
        +login()
        +updateProfile()
        +addWalletBalance()
    }
    
    class Admin {
        +manageSlots()
        +manageUsers()
        +viewReports()
    }
    
    class Slot {
        -String id
        -String name
        -String location
        -Float basePrice
        -String status
        +addSlot()
        +updateStatus()
        +calculateDynamicPrice()
    }
    
    class Booking {
        -String bookingId
        -String userId
        -String slotId
        -DateTime startTime
        -DateTime endTime
        -Float totalAmount
        -String status
        +createBooking()
        +cancelBooking()
        +completeBooking()
    }
    
    class Transaction {
        -String transactionId
        -String userId
        -String type
        -Float amount
        -String status
        -DateTime timestamp
        +initiateTransaction()
        +verifyTransaction()
    }
    
    User <|-- Admin
    User "1" --> "*" Booking : makes
    User "1" --> "*" Transaction : initiates
    Slot "1" --> "*" Booking : records
`;

const usecaseDiagram = `flowchart LR
    User((User))
    Admin((Admin))
    PaymentSys((Payment System))
    
    UC1([Register & Login])
    UC2([Search & Book Slot])
    UC3([Add Money to Wallet])
    UC4([View Booking History])
    
    UC5([Manage Parking Slots])
    UC6([Monitor Analytics])
    UC7([Manage Users])
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    
    Admin --> UC1
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    
    UC3 --> PaymentSys
`;

const b64Class = Buffer.from(classDiagram).toString('base64');
const b64Usecase = Buffer.from(usecaseDiagram).toString('base64');

const mdContent = `# NETPark Smart Parking Management System
**Assigned By:** Nikita mam

---

## 1. Object-Oriented Analysis

### Possible Classes and Objects
- **User**: Represents a general user or driver using the system.
- **Admin**: Represents the system administrator managing the platform.
- **Slot**: Represents a physical parking slot available for booking.
- **Booking**: Represents a reservation made by a user for a slot.
- **Transaction**: Represents a financial record (wallet recharge or booking payment).

### Attributes and Methods
- **User**
  - *Attributes*: id, name, email, phone, password, walletBalance, role, isVerified
  - *Methods*: register(), login(), updateProfile(), addWalletBalance()
- **Admin**
  - *Methods*: manageSlots(), manageUsers(), viewReports()
- **Slot**
  - *Attributes*: id, name, location, basePrice, status
  - *Methods*: addSlot(), updateStatus(), calculateDynamicPrice()
- **Booking**
  - *Attributes*: bookingId, userId, slotId, startTime, endTime, totalAmount, status
  - *Methods*: createBooking(), cancelBooking(), completeBooking()
- **Transaction**
  - *Attributes*: transactionId, userId, type, amount, status, timestamp
  - *Methods*: initiateTransaction(), verifyTransaction()

### Associations & Cardinality
- **User to Booking**: One-to-Many (One user can make multiple bookings)
- **User to Transaction**: One-to-Many (One user can initiate multiple transactions)
- **Slot to Booking**: One-to-Many (One slot can have multiple sequential bookings)

### UML Class Diagram
![UML Class Diagram](https://mermaid.ink/img/${b64Class})

---

## 2. Usecase Analysis

### Identify Usecases and Actors
**Actors:**
- **User**: Registers, logs in, adds money to wallet, books slots, and views history.
- **Admin**: Manages slots, views analytics, and manages users.
- **Payment System**: External entity handling wallet transactions.

**Usecases:**
- Register & Login
- Search & Book Slot
- Add Money to Wallet
- View Booking History
- Manage Parking Slots
- Monitor Analytics
- Manage Users

### Usecase Diagram
![Usecase Diagram](https://mermaid.ink/img/${b64Usecase})
`;

fs.writeFileSync('d:/NETPark/Project_Report.md', mdContent);
console.log("Markdown written!");
