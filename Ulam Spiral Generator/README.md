# 🔢 Ulam Spiral Generator

## 🧘 Zen Level: 1-2 hours
*A mindful dive into math and patterns*

## Overview
The **Ulam Spiral Generator** creates a fascinating mathematical visualization known as the **Ulam Spiral** — a graphical depiction of prime numbers arranged in a spiral pattern. This project generates an `n x n` grid (odd-sized), places numbers in a spiral starting from the center, and marks prime numbers with `*` while non-primes are shown as `.`.  

---

## ✨ Features
- Generates an **Ulam Spiral** for any user-specified odd grid size.  
- Highlights **prime numbers** with `*` and non-primes with `.`.  
- Simple **command-line interface** for interactive use.  
- Displays **prime statistics** (total numbers, prime count, density).  

---

## 📸 Example Output

```
Ulam Spiral Generator
==============================

Please enter an odd number for the grid size: 9

Generating 9x9 Ulam Spiral...

. * * . . * * . . 
. . * . * . . * . 
* . * * . * . . * 
. * . . . * * * . 
. * . . * * . . * 
* . * * . * . . * 
. . * . * . . * . 
. * * . . * * . . 
. . . . . . . . . 

Statistics:
  Total numbers: 81
  Prime numbers: 24
  Prime density: 29.6%
```

---

## 🚀 Usage

1. Run the script:
   ```bash
   python ulam_spiral.py
   ```

2. Enter an **odd number** when prompted for the grid size (e.g., `9`, `15`, `21`).  

3. The program will generate and display the spiral with primes highlighted.  

---

## 🛠 How It Works
- Starts from the **center of the grid** and spirals outward.  
- Uses a **prime-checking function** to mark each number.  
- Outputs a clean ASCII visualization along with prime density statistics.  

---

## 📂 File Structure
```
Ulam Spiral Generator/
│── ulam_spiral.py     # Main script
│── README.md          # Project documentation
```

