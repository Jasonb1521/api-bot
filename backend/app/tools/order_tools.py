"""
Tool definitions for LLM to manage orders with function calling
"""
import logging
import json
from typing import List, Dict, Optional
from datetime import datetime
from app.services.database_service import db_service

logger = logging.getLogger(__name__)

# Tool definitions in OpenAI function calling format
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_item_to_order",
            "description": "Add a menu item to the customer's current order. Call this IMMEDIATELY when customer mentions a dish name and quantity. Examples: '2 idli', 'one coffee', 'dosa'. Do NOT wait for confirmation - add items as they order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dish_name": {
                        "type": "string",
                        "description": "Name of the dish in English (e.g., 'Idli', 'Dosa', 'Coffee')"
                    },
                    "quantity": {
                        "type": "integer",
                        "description": "Quantity ordered (default 1)",
                        "default": 1
                    }
                },
                "required": ["dish_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "remove_item_from_order",
            "description": "Remove an item from the current order if customer changes their mind",
            "parameters": {
                "type": "object",
                "properties": {
                    "dish_name": {
                        "type": "string",
                        "description": "Name of the dish to remove"
                    }
                },
                "required": ["dish_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_order",
            "description": "Get the list of items currently in the order",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "confirm_and_save_order",
            "description": "Confirm and finalize the order, print kitchen bill, and update database inventory. ONLY call this when customer explicitly says confirmation words like 'confirm', 'கன்ஃபர்ம்', 'okay confirm', 'place order', 'confirm order'. Do NOT call for general 'okay' or 'yes' - only for explicit confirmation of the final order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_number": {
                        "type": "string",
                        "description": "Table number (optional)",
                        "default": "1"
                    }
                },
                "required": []
            }
        }
    }
]


class OrderToolExecutor:
    """Executes tool calls from LLM"""

    def __init__(self, client_state: dict):
        self.client_state = client_state

        # DEBUG: Log client_state memory address and current_order status
        logger.info(f"🔍 OrderToolExecutor INIT - client_state id: {id(client_state)}, has current_order: {'current_order' in client_state}, value: {client_state.get('current_order', 'NOT_SET')}")

        # Initialize order in client state if not exists
        if "current_order" not in self.client_state:
            self.client_state["current_order"] = []
            logger.info(f"🔍 INIT - Created new empty current_order")

        if "order_count" not in self.client_state:
            self.client_state["order_count"] = 0

        if "completed_orders" not in self.client_state:
            self.client_state["completed_orders"] = []

    async def execute_tool(self, tool_name: str, arguments: dict) -> dict:
        """
        Execute a tool call from LLM

        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments from LLM

        Returns:
            Result dictionary to send back to LLM
        """
        logger.info(f"🔧 Executing tool: {tool_name} with args: {arguments}")

        if tool_name == "add_item_to_order":
            # Type coercion: convert quantity string to integer if needed
            if "quantity" in arguments and isinstance(arguments["quantity"], str):
                try:
                    arguments["quantity"] = int(arguments["quantity"])
                except (ValueError, TypeError):
                    arguments["quantity"] = 1
            return await self.add_item_to_order(**arguments)

        elif tool_name == "remove_item_from_order":
            return await self.remove_item_from_order(**arguments)

        elif tool_name == "get_current_order":
            return await self.get_current_order()

        elif tool_name == "confirm_and_save_order":
            return await self.confirm_and_save_order(**arguments)

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    async def add_item_to_order(self, dish_name: str, quantity: int = 1) -> dict:
        """Add item to current order (in memory, not DB yet)"""
        try:
            # DEBUG: Log client_state keys and ID
            logger.info(f"🔍 ADD ITEM - client_state id: {id(self.client_state)}, keys: {list(self.client_state.keys())}")

            # Search for dish in database
            item = await db_service.get_item_by_name(dish_name)

            if not item:
                return {
                    "success": False,
                    "error": f"Dish '{dish_name}' not found in menu"
                }

            # Check availability
            if item['availability_status'] != 'available':
                return {
                    "success": False,
                    "error": f"{dish_name} is currently unavailable"
                }

            # Check stock
            if item['quantity'] < quantity:
                return {
                    "success": False,
                    "error": f"Only {item['quantity']} {dish_name} available"
                }

            # Add to order (in memory)
            order_item = {
                "dish_id": item['dish_id'],
                "name": item['name'],
                "quantity": quantity,
                "price": float(item['price'])
            }

            # Check if item already in order
            existing = next(
                (x for x in self.client_state["current_order"]
                 if x['dish_id'] == item['dish_id']),
                None
            )

            if existing:
                existing['quantity'] += quantity
                logger.info(f"✅ Updated {dish_name} quantity to {existing['quantity']}")
            else:
                self.client_state["current_order"].append(order_item)
                logger.info(f"✅ Added {quantity}x {dish_name} to order")

            # DEBUG: Log after adding
            logger.info(f"🔍 AFTER ADD - current_order length: {len(self.client_state['current_order'])}, items: {self.client_state['current_order']}")

            return {
                "success": True,
                "message": f"Added {quantity}x {dish_name} (₹{item['price']} each)",
                "total_price": float(item['price']) * quantity,
                "current_order": self.client_state["current_order"]
            }

        except Exception as e:
            logger.error(f"Error adding item: {e}")
            return {"success": False, "error": str(e)}

    async def remove_item_from_order(self, dish_name: str) -> dict:
        """Remove item from current order"""
        try:
            # Find item in current order
            item_index = next(
                (i for i, x in enumerate(self.client_state["current_order"])
                 if x['name'].lower() == dish_name.lower()),
                None
            )

            if item_index is None:
                return {
                    "success": False,
                    "error": f"{dish_name} not in current order"
                }

            removed_item = self.client_state["current_order"].pop(item_index)
            logger.info(f"✅ Removed {removed_item['name']} from order")

            return {
                "success": True,
                "message": f"Removed {removed_item['name']} from order",
                "current_order": self.client_state["current_order"]
            }

        except Exception as e:
            logger.error(f"Error removing item: {e}")
            return {"success": False, "error": str(e)}

    async def get_current_order(self) -> dict:
        """Get current order items"""
        order_items = self.client_state["current_order"]

        if not order_items:
            return {
                "success": True,
                "message": "Order is empty",
                "items": [],
                "total": 0
            }

        total = sum(item['price'] * item['quantity'] for item in order_items)

        return {
            "success": True,
            "items": order_items,
            "total": float(total),
            "message": f"{len(order_items)} items in order, total ₹{total}"
        }

    async def confirm_and_save_order(self, table_number: str = "1") -> dict:
        """
        Complete order confirmation flow:
        1. Pause ASR
        2. Print kitchen bill
        3. Update PostgreSQL database
        4. Resume ASR for next order
        """
        try:
            # DEBUG: Log the entire client_state keys
            logger.info(f"🔍 DEBUG client_state keys: {list(self.client_state.keys())}")
            logger.info(f"🔍 DEBUG current_order value: {self.client_state.get('current_order', 'KEY_NOT_FOUND')}")

            order_items = self.client_state["current_order"]

            if not order_items:
                logger.error(f"❌ EMPTY ORDER! client_state keys: {list(self.client_state.keys())}")
                return {
                    "success": False,
                    "error": "No items in order to confirm"
                }

            total_amount = sum(item['price'] * item['quantity'] for item in order_items)

            # Increment order count for this session
            self.client_state["order_count"] += 1
            order_number_in_session = self.client_state["order_count"]

            logger.info(f"🎯 Confirming order #{order_number_in_session} for table {table_number}")

            # ==========================================
            # STEP 1: PAUSE ASR
            # ==========================================
            self.client_state["asr_active"] = False
            self.client_state["order_status"] = "processing"

            logger.info("⏸️  ASR paused for order processing")

            # ==========================================
            # STEP 2: PRINT KITCHEN BILL (OPTIONAL)
            # ==========================================
            printed_successfully = False
            try:
                from printing.print_bill import print_bill

                import time
                temp_order_id = int(time.time()) % 100000

                logger.info(f"🖨️  Printing kitchen bill for Order #{temp_order_id}...")

                print_result = print_bill(
                    items=order_items,
                    table_no=table_number,
                    order_id=temp_order_id,
                    order_number=order_number_in_session
                )

                if print_result and print_result.get('success', False):
                    logger.info("✅ Kitchen bill printed successfully!")
                    printed_successfully = True
                else:
                    error_msg = print_result.get('error', 'Printer error') if print_result else 'Printer not responding'
                    logger.warning(f"⚠️ Print failed (continuing anyway): {error_msg}")

            except ImportError as import_error:
                logger.warning(f"⚠️ Printer module not available (continuing anyway): {import_error}")
                # Continue without printing - this is OK
            except Exception as print_error:
                logger.warning(f"⚠️ Print exception (continuing anyway): {print_error}")
                # Continue without printing - this is OK

            # ==========================================
            # STEP 3: UPDATE DATABASE
            # ==========================================
            logger.info("💾 Updating database inventory...")

            conn = await db_service.pool.acquire()

            try:
                async with conn.transaction():
                    # Prepare items for JSONB storage
                    items_json = json.dumps(order_items)

                    # Create order record with items in JSONB column
                    order_id = await conn.fetchval(
                        """
                        INSERT INTO orders (table_number, status, total, items, created_at)
                        VALUES ($1, $2, $3, $4::jsonb, NOW())
                        RETURNING order_id
                        """,
                        table_number,
                        "confirmed",
                        total_amount,
                        items_json
                    )

                    logger.info(f"📝 Created order #{order_id} in database with {len(order_items)} items")

                    # Update each item's inventory
                    for item in order_items:
                        # Safety check - verify current stock
                        current_qty = await conn.fetchval(
                            "SELECT quantity FROM menu_items WHERE dish_id = $1",
                            item['dish_id']
                        )

                        if current_qty is None:
                            raise Exception(f"Item {item['name']} not found in database")

                        if current_qty < item['quantity']:
                            raise Exception(
                                f"Insufficient stock for {item['name']} "
                                f"(available: {current_qty}, ordered: {item['quantity']})"
                            )

                        # Reduce inventory
                        await conn.execute(
                            """
                            UPDATE menu_items
                            SET quantity = quantity - $1,
                                updated_at = NOW()
                            WHERE dish_id = $2
                            """,
                            item['quantity'],
                            item['dish_id']
                        )

                        logger.info(f"✅ {item['name']}: quantity reduced by {item['quantity']}")

                    logger.info(f"✅ Database updated successfully for Order #{order_id}")

                    # ==========================================
                    # STEP 4: FINALIZE - Clear order, KEEP ASR PAUSED
                    # ==========================================
                    order_summary = self.client_state["current_order"].copy()
                    self.client_state["current_order"] = []  # Clear for next order

                    # Track completed orders in session
                    self.client_state["completed_orders"].append({
                        "order_id": order_id,
                        "items": order_summary,
                        "total": float(total_amount),
                        "timestamp": datetime.now().isoformat()
                    })

                    # KEEP ASR PAUSED - user must click button to start new order
                    self.client_state["asr_active"] = False
                    self.client_state["order_status"] = "completed"

                    # Calculate session total
                    session_total = sum(
                        o["total"] for o in self.client_state["completed_orders"]
                    )

                    logger.info(f"✅ Order complete! ASR remains paused. Session total: ₹{session_total}")

                    return {
                        "success": True,
                        "order_id": order_id,
                        "message": f"Order confirmed! Bill sent to kitchen. Thank you!",
                        "total": float(total_amount),
                        "items": order_summary,
                        "printed": printed_successfully,
                        "database_updated": True,
                        "order_number": order_number_in_session,
                        "total_orders_in_session": len(self.client_state["completed_orders"]),
                        "session_total": float(session_total),
                        "show_confirmation": True,  # Signal to frontend to show confirmation screen
                        "confirmation_duration": 10  # Show for 10 seconds
                    }

            except Exception as db_error:
                logger.error(f"❌ Database error: {db_error}")

                # CRITICAL: Bill printed but DB failed
                return {
                    "success": False,
                    "error": f"CRITICAL: Bill printed but database failed: {str(db_error)}",
                    "printed": True,
                    "database_updated": False,
                    "requires_manual_intervention": True,
                    "order_details": order_items
                }

            finally:
                await db_service.pool.release(conn)

        except Exception as e:
            logger.error(f"❌ Confirmation failed: {e}")
            import traceback
            traceback.print_exc()

            # Re-enable ASR on general error
            self.client_state["asr_active"] = True
            self.client_state["order_status"] = "active"

            return {
                "success": False,
                "error": str(e),
                "order_preserved": True,
                "resume_asr": True
            }
