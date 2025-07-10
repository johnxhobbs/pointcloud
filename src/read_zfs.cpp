#include <Rcpp.h>
#include <fstream>
using namespace Rcpp;

// [[Rcpp::export]]
List read_zfs(std::string file, int x = 720, int y = 5120) {
  
  // Open file in binary mode
  std::ifstream fs(file, std::ios::binary);
  if (!fs.is_open()) {
    stop("Cannot open file: " + file);
  }
  
  // Skip to offset 0x4000
  fs.seekg(0x4000);
  if (fs.fail()) {
    stop("Cannot seek to offset 0x4000");
  }
  
  // Create matrices
  RawMatrix lineheaders(x, 40);
  IntegerMatrix matrix1(x, y);
  IntegerMatrix matrix2(x, y);
  IntegerMatrix matrix3(x, y);
  IntegerMatrix matrix4(x, y);
  
  // Buffer for reading chunks
  std::vector<char> header_buffer(40);
  std::vector<char> data_buffer(14);
  
  // Process x chunks (rotations)
  for (int i = 0; i < x; i++) {
    
    // Read 40-byte header
    fs.read(&header_buffer[0], 40);
    if (fs.gcount() != 40) {
      stop("Failed to read header at chunk " + std::to_string(i));
    }
    
    // Store header in lineheaders matrix
    for (int j = 0; j < 40; j++) {
      lineheaders(i, j) = static_cast<unsigned char>(header_buffer[j]);
    }
    
    // Read y data chunks (5120 readings per rotation)
    for (int j = 0; j < y; j++) {
      
      fs.read(&data_buffer[0], 14);
      if (fs.gcount() != 14) {
        stop("Failed to read data at chunk " + std::to_string(i) + 
          ", reading " + std::to_string(j));
      }
      
      // Extract bytes and convert to integers (little-endian)
      // Bytes 1:2 (0-indexed: 0:1)
      int val1 = static_cast<unsigned char>(data_buffer[0]) | 
        (static_cast<unsigned char>(data_buffer[1]) << 8);
      matrix1(i, j) = val1;
      
      // Bytes 4:5 (0-indexed: 3:4)  
      int val2 = static_cast<unsigned char>(data_buffer[3]) | 
        (static_cast<unsigned char>(data_buffer[4]) << 8);
      matrix2(i, j) = val2;
      
      // Bytes 9:10 (0-indexed: 8:9)
      int val3 = static_cast<unsigned char>(data_buffer[8]) | 
        (static_cast<unsigned char>(data_buffer[9]) << 8);
      matrix3(i, j) = val3;
      
      // Bytes 11:12 (0-indexed: 10:11)
      int val4 = static_cast<unsigned char>(data_buffer[10]) | 
        (static_cast<unsigned char>(data_buffer[11]) << 8);
      matrix4(i, j) = val4;
    }
  }
  
  fs.close();
  
  return List::create(
    Named("lineheaders") = lineheaders,
    Named("matrix1") = matrix1,
    Named("matrix2") = matrix2, 
    Named("matrix3") = matrix3,
    Named("matrix4") = matrix4
  );
}