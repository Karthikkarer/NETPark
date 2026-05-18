# NETPark Smart Parking Management System
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
![UML Class Diagram](https://mermaid.ink/img/Y2xhc3NEaWFncmFtCiAgICBjbGFzcyBVc2VyIHsKICAgICAgICAtU3RyaW5nIGlkCiAgICAgICAgLVN0cmluZyBuYW1lCiAgICAgICAgLVN0cmluZyBlbWFpbAogICAgICAgIC1TdHJpbmcgcGhvbmUKICAgICAgICAtU3RyaW5nIHBhc3N3b3JkCiAgICAgICAgLUZsb2F0IHdhbGxldEJhbGFuY2UKICAgICAgICAtU3RyaW5nIHJvbGUKICAgICAgICAtQm9vbGVhbiBpc1ZlcmlmaWVkCiAgICAgICAgK3JlZ2lzdGVyKCkKICAgICAgICArbG9naW4oKQogICAgICAgICt1cGRhdGVQcm9maWxlKCkKICAgICAgICArYWRkV2FsbGV0QmFsYW5jZSgpCiAgICB9CiAgICAKICAgIGNsYXNzIEFkbWluIHsKICAgICAgICArbWFuYWdlU2xvdHMoKQogICAgICAgICttYW5hZ2VVc2VycygpCiAgICAgICAgK3ZpZXdSZXBvcnRzKCkKICAgIH0KICAgIAogICAgY2xhc3MgU2xvdCB7CiAgICAgICAgLVN0cmluZyBpZAogICAgICAgIC1TdHJpbmcgbmFtZQogICAgICAgIC1TdHJpbmcgbG9jYXRpb24KICAgICAgICAtRmxvYXQgYmFzZVByaWNlCiAgICAgICAgLVN0cmluZyBzdGF0dXMKICAgICAgICArYWRkU2xvdCgpCiAgICAgICAgK3VwZGF0ZVN0YXR1cygpCiAgICAgICAgK2NhbGN1bGF0ZUR5bmFtaWNQcmljZSgpCiAgICB9CiAgICAKICAgIGNsYXNzIEJvb2tpbmcgewogICAgICAgIC1TdHJpbmcgYm9va2luZ0lkCiAgICAgICAgLVN0cmluZyB1c2VySWQKICAgICAgICAtU3RyaW5nIHNsb3RJZAogICAgICAgIC1EYXRlVGltZSBzdGFydFRpbWUKICAgICAgICAtRGF0ZVRpbWUgZW5kVGltZQogICAgICAgIC1GbG9hdCB0b3RhbEFtb3VudAogICAgICAgIC1TdHJpbmcgc3RhdHVzCiAgICAgICAgK2NyZWF0ZUJvb2tpbmcoKQogICAgICAgICtjYW5jZWxCb29raW5nKCkKICAgICAgICArY29tcGxldGVCb29raW5nKCkKICAgIH0KICAgIAogICAgY2xhc3MgVHJhbnNhY3Rpb24gewogICAgICAgIC1TdHJpbmcgdHJhbnNhY3Rpb25JZAogICAgICAgIC1TdHJpbmcgdXNlcklkCiAgICAgICAgLVN0cmluZyB0eXBlCiAgICAgICAgLUZsb2F0IGFtb3VudAogICAgICAgIC1TdHJpbmcgc3RhdHVzCiAgICAgICAgLURhdGVUaW1lIHRpbWVzdGFtcAogICAgICAgICtpbml0aWF0ZVRyYW5zYWN0aW9uKCkKICAgICAgICArdmVyaWZ5VHJhbnNhY3Rpb24oKQogICAgfQogICAgCiAgICBVc2VyIDx8LS0gQWRtaW4KICAgIFVzZXIgIjEiIC0tPiAiKiIgQm9va2luZyA6IG1ha2VzCiAgICBVc2VyICIxIiAtLT4gIioiIFRyYW5zYWN0aW9uIDogaW5pdGlhdGVzCiAgICBTbG90ICIxIiAtLT4gIioiIEJvb2tpbmcgOiByZWNvcmRzCg==)

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
![Usecase Diagram](https://mermaid.ink/img/Zmxvd2NoYXJ0IExSCiAgICBVc2VyKChVc2VyKSkKICAgIEFkbWluKChBZG1pbikpCiAgICBQYXltZW50U3lzKChQYXltZW50IFN5c3RlbSkpCiAgICAKICAgIFVDMShbUmVnaXN0ZXIgJiBMb2dpbl0pCiAgICBVQzIoW1NlYXJjaCAmIEJvb2sgU2xvdF0pCiAgICBVQzMoW0FkZCBNb25leSB0byBXYWxsZXRdKQogICAgVUM0KFtWaWV3IEJvb2tpbmcgSGlzdG9yeV0pCiAgICAKICAgIFVDNShbTWFuYWdlIFBhcmtpbmcgU2xvdHNdKQogICAgVUM2KFtNb25pdG9yIEFuYWx5dGljc10pCiAgICBVQzcoW01hbmFnZSBVc2Vyc10pCiAgICAKICAgIFVzZXIgLS0+IFVDMQogICAgVXNlciAtLT4gVUMyCiAgICBVc2VyIC0tPiBVQzMKICAgIFVzZXIgLS0+IFVDNAogICAgCiAgICBBZG1pbiAtLT4gVUMxCiAgICBBZG1pbiAtLT4gVUM1CiAgICBBZG1pbiAtLT4gVUM2CiAgICBBZG1pbiAtLT4gVUM3CiAgICAKICAgIFVDMyAtLT4gUGF5bWVudFN5cwo=)
