# RESTful Web API with Node.js Framework Project

For this project, we’ll build a RESTful API using a Node.js framework that will interface with the private blockchain we completed Project 2 - "Private Blockchain". We’ll want to build this project out in steps.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Clone the repository in your local environment
```
git clone <url GitHuib Repo>
```
- Go to the project folder
```
cd <project name>
```
- Install the dependencies (crypto-js, level and hapi)
```
npm install
```
- To start the server
```
npm start
```

## Endpoints definition

### Get Block
----
  Returns json data about a specific block using its block height to be found in the chain.

* **URL**

  http://localhost:8000/block/{block_height}

* **Method:**

    `GET`
  
*  **URL Params**

   **Required:**
 
    `block_height=[integer]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
"hash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3",
"height":0,
"body":"First block in the chain - Genesis block",
"time":"1530311457",
"previousBlockHash":""
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "Block# 0 doesn't exist" }`

* **Sample Call:**

  ```
  curl -H "Content-Type: application/json" -X GET http://localhost:8000/block/0
  ```

### Post Block
----
  Request to add new block to the chain. Block data passing inthe body payload parameter. Returns json data with the block data already added to the chain.

* **URL**

    http://localhost:8000/block

* **Method:**

    `POST`
  
*  **URL Params**

   None

* **Data Params**

  **Required:**
 
    `{"body":"Testing block with test string data"}`

 **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{
    "hash": "5431477243795a06a8b0dd11d8560808aab35c14fe7af8eafa2bcd8624e6f24b",
    "height": 2,
    "body": "Testing block with test string data",
    "time": "1536938718",
    "previousBlockHash": "4c11f39fc2f2318475d91175284b9d09fbc69aba404e672eb6cfc0d7a903ab8d"
}`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{Error: "No content on body payload"}`

* **Sample Call:**

  ```
  curl -d '{"body":"Testing block with test string data"}' -H "Content-Type: application/json" -X POST http://localhost:8000/block
  ```