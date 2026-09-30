const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const SystemSettings = require('../models/SystemSettings');
const InventoryHistory = require('../models/InventoryHistory');

const seedInitialData = async () => {
  try {
    console.log('[Seeder] Checking and initializing database defaults...');

    // 1. Settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        restaurantName: 'Royal Burgundy Restaurant & Bistro',
        address: '840 Gourmet Avenue, Suite 101',
        phone: '+1 (555) 329-8472',
        email: 'info@royalburgundy.local',
        currency: '$',
        taxRate: 5,
        receiptHeader: '*** ROYAL BURGUNDY RESTAURANT ***\nFine Dining & Quick Service',
        receiptFooter: 'Thank you for your visit! Please come again.\nOffline POS System v1.0',
        lowStockThreshold: 10
      });
      console.log('[Seeder] Default system settings created.');
    }

    // 2. Default Users
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'Executive Administrator',
        role: 'admin',
        phone: '+1 555-0100',
        isActive: true
      });
      console.log('[Seeder] Admin user created: admin / admin123');
    }

    let cashierUser = await User.findOne({ username: 'cashier1' });
    if (!cashierUser) {
      cashierUser = await User.create({
        username: 'cashier1',
        password: 'cashier123',
        fullName: 'Sarah Cashier',
        role: 'cashier',
        phone: '+1 555-0101',
        isActive: true
      });
      console.log('[Seeder] Cashier user created: cashier1 / cashier123');
    }

    // 3. Categories
    const categoryCount = await Category.countDocuments();
    let catMap = {};

    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'Burgers & Sandwiches', description: 'Gourmet handcrafted burgers and artisanal sandwiches' },
        { name: 'Pizzas & Italian', description: 'Wood-fired thin crust pizzas and pastas' },
        { name: 'Main Courses', description: 'Steaks, poultry, seafood, and chef specialties' },
        { name: 'Appetizers & Sides', description: 'Crispy finger foods, salads, and starters' },
        { name: 'Beverages & Drinks', description: 'Fresh juices, iced sodas, and mocktails' },
        { name: 'Desserts & Sweets', description: 'Artisanal cakes, pies, and gelato' }
      ];

      for (const catData of defaultCategories) {
        const cat = await Category.create(catData);
        catMap[cat.name] = cat._id;
      }
      console.log('[Seeder] Default categories populated.');
    } else {
      const existingCategories = await Category.find();
      existingCategories.forEach((c) => {
        catMap[c.name] = c._id;
      });
    }

    // 4. Menu Items
    const itemCount = await MenuItem.countDocuments();
    if (itemCount === 0) {
      const sampleItems = [
        // Burgers & Sandwiches
        {
          name: 'Chicken Burger',
          category: catMap['Burgers & Sandwiches'],
          description: 'Crispy fried chicken breast, brioche bun, spicy aioli, pickles, lettuce',
          price: 9.99,
          stockQuantity: 5, // Demonstrating LOW STOCK ALERT (threshold is 10)
          isAvailable: true
        },
        {
          name: 'Classic Burgundy Beef Burger',
          category: catMap['Burgers & Sandwiches'],
          description: 'Angus beef patty, caramelized onions, cheddar cheese, secret burger relish',
          price: 12.50,
          stockQuantity: 28,
          isAvailable: true
        },
        {
          name: 'Smoked Turkey Club Sandwich',
          category: catMap['Burgers & Sandwiches'],
          description: 'Triple-decker sourdough with roasted turkey, smoked bacon, tomato, mayo',
          price: 11.00,
          stockQuantity: 18,
          isAvailable: true
        },
        // Pizzas & Italian
        {
          name: 'Margherita Pizza 12"',
          category: catMap['Pizzas & Italian'],
          description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, olive oil',
          price: 14.50,
          stockQuantity: 25,
          isAvailable: true
        },
        {
          name: 'Pepperoni Supreme Pizza 12"',
          category: catMap['Pizzas & Italian'],
          description: 'Loaded beef pepperoni, mozzarella cheese, crushed red peppers, herb tomato sauce',
          price: 16.99,
          stockQuantity: 20,
          isAvailable: true
        },
        {
          name: 'Creamy Fettuccine Alfredo',
          category: catMap['Pizzas & Italian'],
          description: 'Fresh fettuccine tossed in rich parmesan garlic cream sauce with parsley',
          price: 13.75,
          stockQuantity: 15,
          isAvailable: true
        },
        // Main Courses
        {
          name: 'Grilled Ribeye Steak 10oz',
          category: catMap['Main Courses'],
          description: 'Prime cut ribeye grilled with garlic rosemary butter, served with roasted potatoes',
          price: 24.99,
          stockQuantity: 12,
          isAvailable: true
        },
        {
          name: 'Herb Roasted Salmon',
          category: catMap['Main Courses'],
          description: 'Pan-seared Atlantic salmon fillet with lemon-dill glaze and asparagus',
          price: 21.50,
          stockQuantity: 8, // Low Stock demonstration
          isAvailable: true
        },
        // Appetizers & Sides
        {
          name: 'Crispy French Fries',
          category: catMap['Appetizers & Sides'],
          description: 'Golden salted shoestring potatoes served with garlic dip',
          price: 4.50,
          stockQuantity: 60,
          isAvailable: true
        },
        {
          name: 'Buffalo Chicken Wings (8pcs)',
          category: catMap['Appetizers & Sides'],
          description: 'Spicy glazed wings served with crunchy celery and blue cheese sauce',
          price: 8.99,
          stockQuantity: 35,
          isAvailable: true
        },
        {
          name: 'Mozzarella Cheese Sticks',
          category: catMap['Appetizers & Sides'],
          description: 'Golden breaded mozzarella served with warm marinara dipping sauce',
          price: 6.99,
          stockQuantity: 4, // Low Stock demonstration
          isAvailable: true
        },
        // Beverages & Drinks
        {
          name: 'Fresh Lemon Mint Cooler',
          category: catMap['Beverages & Drinks'],
          description: 'Freshly squeezed lemons with crushed fresh mint leaves and sparkling soda',
          price: 3.99,
          stockQuantity: 80,
          isAvailable: true
        },
        {
          name: 'Iced Caramel Macchiato',
          category: catMap['Beverages & Drinks'],
          description: 'Double espresso shot over cold milk, vanilla syrup, and buttery caramel drizzle',
          price: 4.75,
          stockQuantity: 45,
          isAvailable: true
        },
        {
          name: 'Mineral Sparkling Water',
          category: catMap['Beverages & Drinks'],
          description: 'Refreshing carbonated mineral water (500ml)',
          price: 2.50,
          stockQuantity: 100,
          isAvailable: true
        },
        // Desserts
        {
          name: 'Burgundy Velvet Chocolate Cake',
          category: catMap['Desserts & Sweets'],
          description: 'Decadent dark chocolate sponge layered with rich ganache and berries',
          price: 6.50,
          stockQuantity: 14,
          isAvailable: true
        },
        {
          name: 'Classic New York Cheesecake',
          category: catMap['Desserts & Sweets'],
          description: 'Creamy baked cheesecake with strawberry reduction',
          price: 6.95,
          stockQuantity: 10,
          isAvailable: true
        }
      ];

      for (const itemData of sampleItems) {
        if (itemData.category) {
          const item = await MenuItem.create(itemData);
          // Record initial inventory history
          await InventoryHistory.create({
            menuItem: item._id,
            itemName: item.name,
            type: 'initial',
            quantityChange: item.stockQuantity,
            previousStock: 0,
            newStock: item.stockQuantity,
            reason: 'Default menu catalogue seeder',
            user: adminUser._id,
            userName: adminUser.fullName
          });
        }
      }
      console.log('[Seeder] Default menu items created with inventory records.');
    }

    // 5. Tables
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const defaultTables = [
        { tableNumber: 'T-01', capacity: 2, status: 'available' },
        { tableNumber: 'T-02', capacity: 2, status: 'available' },
        { tableNumber: 'T-03', capacity: 4, status: 'available' },
        { tableNumber: 'T-04', capacity: 4, status: 'available' },
        { tableNumber: 'T-05', capacity: 4, status: 'available' },
        { tableNumber: 'T-06', capacity: 6, status: 'available' },
        { tableNumber: 'T-07', capacity: 6, status: 'available' },
        { tableNumber: 'T-08', capacity: 8, status: 'available' },
        { tableNumber: 'VIP-01', capacity: 8, status: 'reserved' },
        { tableNumber: 'PATIO-1', capacity: 4, status: 'available' }
      ];

      await Table.insertMany(defaultTables);
      console.log('[Seeder] Default restaurant tables created.');
    }

    console.log('[Seeder] Database initialization complete.');
  } catch (err) {
    console.error('[Seeder] Error during seed:', err);
  }
};

module.exports = seedInitialData;
