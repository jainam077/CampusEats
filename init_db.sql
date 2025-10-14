CREATE DATABASE campus_eat;
USE campus_eat;

CREATE TABLE menus (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    menu_type VARCHAR(50) NOT NULL,
    total_items INT
);

CREATE TABLE sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT,
    name VARCHAR(100),
    item_count INT,
    FOREIGN KEY (menu_id) REFERENCES menus(menu_id)
);

CREATE TABLE items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT,
    name VARCHAR(255),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);
