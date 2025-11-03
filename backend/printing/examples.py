"""
Examples of how to use the bill printer with different food items

Simple format with only:
- Table Number
- Order Number
- Date & Time (auto-generated)
- Item & Quantity

Usage:
    python3 examples.py
"""

from print_bill import print_bill

# ============================================
# Example 1: Simple Breakfast Order
# ============================================
def example_breakfast():
    items = [
        {"name": "Idli", "qty": 4},
        {"name": "Vada", "qty": 2},
        {"name": "Filter Coffee", "qty": 2},
    ]
    print_bill(items, table_no="5", order_id="B001")


# ============================================
# Example 2: Full Meal
# ============================================
def example_full_meal():
    items = [
        {"name": "Masala Dosa", "qty": 2},
        {"name": "Rava Dosa", "qty": 1},
        {"name": "Pongal", "qty": 1},
        {"name": "Medu Vada", "qty": 3},
        {"name": "Filter Coffee", "qty": 2},
        {"name": "Tea", "qty": 1},
    ]
    print_bill(items, table_no="12")


# ============================================
# Example 3: Quick Snack
# ============================================
def example_snack():
    items = [
        {"name": "Samosa", "qty": 4},
        {"name": "Tea", "qty": 2},
    ]
    print_bill(items, table_no="3", order_id="S123")


# ============================================
# Example 4: Large Family Order
# ============================================
def example_family_order():
    items = [
        {"name": "Plain Dosa", "qty": 3},
        {"name": "Masala Dosa", "qty": 2},
        {"name": "Onion Dosa", "qty": 2},
        {"name": "Idli", "qty": 8},
        {"name": "Vada", "qty": 6},
        {"name": "Pongal", "qty": 2},
        {"name": "Kesari", "qty": 3},
        {"name": "Filter Coffee", "qty": 4},
        {"name": "Tea", "qty": 2},
    ]
    print_bill(items, table_no="8", order_id="F456")


# ============================================
# Example 5: Special Items
# ============================================
def example_special():
    items = [
        {"name": "Ghee Roast", "qty": 1},
        {"name": "Paper Dosa", "qty": 1},
        {"name": "Uthappam", "qty": 2},
        {"name": "Kesari", "qty": 2},
        {"name": "Filter Coffee", "qty": 2},
    ]
    print_bill(items, table_no="15")


# ============================================
# Custom Order - Add your items here!
# ============================================
def custom_order():
    """
    Create your own custom order here

    Format: {"name": "Item Name", "qty": quantity}
    """
    items = [
        # Add your items here
        {"name": "Masala Dosa", "qty": 1},
        {"name": "Filter Coffee", "qty": 1},
    ]

    print_bill(items, table_no="1", order_id=None)  # order_id is auto-generated


# ============================================
# Main Menu
# ============================================
if __name__ == "__main__":
    print("\n" + "="*50)
    print("APPUCHI VILAS - Bill Printing Examples")
    print("="*50)
    print("\nSelect an example to print:")
    print("1. Breakfast Order")
    print("2. Full Meal")
    print("3. Quick Snack")
    print("4. Large Family Order")
    print("5. Special Items")
    print("6. Custom Order (edit examples.py)")
    print("0. Exit")
    print("="*50)

    try:
        choice = input("\nEnter your choice (0-6): ").strip()

        if choice == "1":
            print("\n📄 Printing Breakfast Order...")
            example_breakfast()
        elif choice == "2":
            print("\n📄 Printing Full Meal...")
            example_full_meal()
        elif choice == "3":
            print("\n📄 Printing Quick Snack...")
            example_snack()
        elif choice == "4":
            print("\n📄 Printing Large Family Order...")
            example_family_order()
        elif choice == "5":
            print("\n📄 Printing Special Items...")
            example_special()
        elif choice == "6":
            print("\n📄 Printing Custom Order...")
            custom_order()
        elif choice == "0":
            print("\n👋 Goodbye!")
        else:
            print("\n❌ Invalid choice!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure the printer is connected!")
