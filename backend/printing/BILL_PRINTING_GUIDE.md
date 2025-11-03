# Bill Printing Guide - Simple Format

Minimal bill format with only essential information:
- Table Number
- Order Number
- Date & Time (auto-generated)
- Item Name & Quantity

## Quick Start

### Method 1: Simple Test (Easiest)

Edit `test_print.py` and add your items:

```python
items = [
    {"name": "Masala Dosa", "qty": 2},
    {"name": "Filter Coffee", "qty": 1},
]
```

Then run:
```bash
python3 test_print.py
```

### Method 2: Use Examples

Choose from pre-made examples:
```bash
python3 examples.py
```

Then select option 1-6.

### Method 3: Use in Your Code

```python
from print_bill import print_bill

# Define items
items = [
    {"name": "Masala Dosa", "qty": 2},
    {"name": "Idli Sambar", "qty": 1},
    {"name": "Filter Coffee", "qty": 2},
]

# Print bill
print_bill(items, table_no="5", order_id="A123")
```

## Item Format

Each item must have:
- `name`: Item name (string, max 24 characters visible)
- `qty`: Quantity (integer)

Example:
```python
{"name": "Masala Dosa", "qty": 2}
```

## Bill Format

The printed bill includes:

1. **Table Number** (bold)
2. **Order ID** (bold, auto-generated if not provided)
3. **Date & Time** (auto-generated)
4. **Items List**
   - Item name
   - Quantity

## Common Menu Items

### Breakfast Items
- Idli
- Vada
- Pongal
- Kesari

### Dosas
- Plain Dosa
- Masala Dosa
- Onion Dosa
- Rava Dosa
- Ghee Roast
- Paper Dosa

### Beverages
- Filter Coffee
- Tea

### Others
- Uthappam
- Samosa

## Functions

### `print_bill(items, table_no, order_id)`

**Parameters:**
- `items` (list): List of items with name and qty
- `table_no` (str): Table number (default: "1")
- `order_id` (str): Order ID (default: auto-generated)

**Example:**
```python
print_bill(
    items=[
        {"name": "Masala Dosa", "qty": 2},
        {"name": "Filter Coffee", "qty": 2}
    ],
    table_no="7",
    order_id="A1001"
)
```

## Add Any Food Item

You can print bills for **ANY** food items. Just follow the format:

```python
items = [
    {"name": "Your Item Name", "qty": how_many},
    {"name": "Another Item", "qty": 1},
    # Add as many items as you want...
]

print_bill(items, table_no="YOUR_TABLE")
```

## Files

- `print_bill.py` - Main printing module
- `test_print.py` - Quick test file (edit and run)
- `examples.py` - Pre-made examples with menu

## Troubleshooting

**Printer not found?**
- Connect the Rugtek printer (USB ID: 0fe6:811e)
- Check: `lsusb | grep 0fe6`

**Nothing prints?**
- Check thermal paper is installed correctly (shiny side up)
- Check printer is powered on
- Check paper is not jammed

**Blank prints?**
- Thermal paper might be upside down
- Print head might need cleaning
