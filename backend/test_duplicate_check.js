const productModel = require('./models/product');

async function testDuplicateCheck() {
    try {
        console.log('Testing duplicate product code check...');
        
        // Tạo sản phẩm đầu tiên
        console.log('Creating first product with code SP_TEST...');
        const product1 = await productModel.createProduct(
            'Test Product 1',
            'Test description 1',
            100.00,
            'Test Category',
            'Test Brand',
            null,
            'SP_TEST'
        );
        console.log('First product created successfully:', product1);
        
        // Thử tạo sản phẩm thứ hai với cùng mã
        console.log('Attempting to create second product with same code SP_TEST...');
        try {
            const product2 = await productModel.createProduct(
                'Test Product 2',
                'Test description 2',
                200.00,
                'Test Category',
                'Test Brand',
                null,
                'SP_TEST'
            );
            console.log('ERROR: Second product was created despite duplicate code!', product2);
        } catch (error) {
            if (error.message === 'Mã sản phẩm đã tồn tại') {
                console.log('SUCCESS: Duplicate code correctly rejected with message:', error.message);
            } else {
                console.log('ERROR: Unexpected error message:', error.message);
            }
        }
        
        // Xóa sản phẩm test để dọn dẹp
        try {
            await productModel.deleteProduct('SP_TEST');
            console.log('Test product deleted successfully');
        } catch (error) {
            console.log('Note: Could not delete test product:', error.message);
        }
        
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

testDuplicateCheck();