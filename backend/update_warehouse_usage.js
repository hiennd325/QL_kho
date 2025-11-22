const warehouseModel = require('./models/warehouse');

async function updateAllWarehouseUsage() {
    try {
        console.log('Updating current_usage for all warehouses...');

        // Get all warehouses
        const warehouses = await warehouseModel.getWarehouses();

        for (const warehouse of warehouses) {
            await warehouseModel.updateCurrentUsage(warehouse.custom_id);
            console.log(`Updated ${warehouse.name} (${warehouse.custom_id}): current_usage calculated`);
        }

        console.log('All warehouses updated successfully!');
    } catch (error) {
        console.error('Error updating warehouses:', error);
    }
}

updateAllWarehouseUsage();