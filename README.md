# 🛡️ SpendLog Backend API

**SpendLog** is a smart financial tracking assistant designed to simplify expense management through **Artificial Intelligence**.

Unlike traditional trackers that require manual form filling, SpendLog integrates with **Telegram** to accept natural language input. The backend leverages AI to automatically parse messages, categorize transactions, and structure data, making financial tracking as easy as sending a text message.

Built with scalable architecture in mind using **NestJS**, **Prisma**, and **PostgreSQL**.

## 📋 Features

* 🤖 **AI-Powered Parsing:** Automatically extracts amount, currency, and category from natural language messages (e.g., *"Lunch 15 usd"*).
* 🧠 **Smart Categorization:** Uses AI to suggest or assign categories based on transaction context.
* **RESTful API** architecture for seamless client-server communication.
* **Database Management** using Prisma ORM & PostgreSQL for data integrity.
* **Telegram Bot Integration** for instant interaction via chat.
* **Validation** using `class-validator` & DTOs.
* **Swagger API Documentation** (available at `/api`).

## 🛠️ Tech Stack

## 🛠️ Tech Stack

* **Framework:** NestJS
* **Language:** TypeScript.
* **Database:** PostgreSQL.
* **ORM:** Prisma
* **Bot Integration:** `nestjs-telegraf`
* **Authentication & Security:**
  * **JWT (`@nestjs/jwt`):** 
  * **Cookies (`cookie-parser`):** 
* **Utilities:**
  * **Task Scheduling (`@nestjs/schedule`):**
  * **Validation (`class-validator`):** 
  * **External Requests (`node-fetch`):** 