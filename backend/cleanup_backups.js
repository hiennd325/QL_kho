const fs = require('fs');
const path = require('path');

// Hàm dọn dẹp các file backup cũ
function cleanupOldBackups(maxBackups = 3) {
    const backendDir = __dirname;
    
    // Đọc tất cả các file trong thư mục backend
    fs.readdir(backendDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }
        
        // Lọc ra các file backup
        const backupFiles = files.filter(file => {
            // Kiểm tra xem file có phải là backup không
            if (!file.startsWith('database.db.backup.')) {
                return false;
            }
            
            // Tách chuỗi để lấy timestamp
            const parts = file.split('.');
            if (parts.length < 4) {
                return false;
            }
            
            // Kiểm tra phần timestamp là số (phần tử thứ 4, index 3)
            const timestamp = parts[3];
            return !isNaN(timestamp) && timestamp.length >= 10; // Timestamp thường có ít nhất 10 chữ số
        });
        
        // Sắp xếp theo thời gian (timestamp)
        backupFiles.sort((a, b) => {
            const timestampA = parseInt(a.split('.')[3]); // Phần tử thứ 4, index 3
            const timestampB = parseInt(b.split('.')[3]); // Phần tử thứ 4, index 3
            return timestampB - timestampA; // Sắp xếp giảm dần (mới nhất trước)
        });
        
        console.log('Found backup files:', backupFiles);
        
        // Xóa các file cũ hơn maxBackups
        if (backupFiles.length > maxBackups) {
            const filesToDelete = backupFiles.slice(maxBackups);
            console.log('Deleting old backup files:', filesToDelete);
            filesToDelete.forEach(file => {
                const filePath = path.join(backendDir, file);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', filePath, err);
                    } else {
                        console.log('Deleted old backup file:', file);
                    }
                });
            });
        } else {
            console.log(`Keeping all ${backupFiles.length} backup files (max: ${maxBackups})`);
        }
    });
}

module.exports = cleanupOldBackups;

// Nếu chạy trực tiếp thì thực hiện dọn dẹp
if (require.main === module) {
    const maxBackups = process.argv[2] ? parseInt(process.argv[2]) : 3;
    cleanupOldBackups(maxBackups);
}