-- Paper Link Database Schema and Seed Data
-- Database: ITECH3108_vikaskundal_a2
-- Run this after creating the database: psql -d ITECH3108_vikaskundal_a2 -f sql/init.sql

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS hidden_links CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Members table
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Links table
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ratings table (one rating per member per link)
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    is_positive BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(link_id, member_id)
);

-- Hidden links table (members can hide links)
CREATE TABLE hidden_links (
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    PRIMARY KEY (member_id, link_id)
);

-- Indexes for performance
CREATE INDEX idx_links_member_id ON links(member_id);
CREATE INDEX idx_links_created_at ON links(created_at);
CREATE INDEX idx_ratings_link_id ON ratings(link_id);
CREATE INDEX idx_ratings_member_id ON ratings(member_id);
CREATE INDEX idx_hidden_links_member_id ON hidden_links(member_id);

-- Seed data: 3 members
-- Password for all: "password" (bcrypt hashed)
-- You can use these credentials to log in
INSERT INTO members (username, password_hash, points) VALUES
('alice', '$2a$10$suy7H/P8z6quznHMrNpi.echWxCclPKrjdQnmvDzN/bS5VAMnIE0O', 0),
('bob', '$2a$10$cNdXQYgKy8avI0RiJEOQuuxW0ri.II8KH.ATzLgk.uTfGgj.OyJWu', 0),
('charlie', '$2a$10$R4n1nAnp2ilBvjbhhUm7Z.GjVlc7JsjwYOuurMdZMqWBWuO0jPH72', 0);

-- Seed data: 5 links
INSERT INTO links (member_id, title, description, url, created_at) VALUES
(1, 'Origami Paper Folding Techniques', 'A comprehensive guide to traditional and modern origami paper folding techniques. Learn the basics and advanced patterns for creating beautiful paper sculptures.', 'https://example.com/origami-guide', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 'Best Paper for Watercolor Painting', 'Discover the top paper brands and types for watercolor painting. Includes reviews of texture, weight, and absorbency for different artistic styles.', 'https://example.com/watercolor-paper', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(2, 'Paper Recycling: Environmental Impact', 'Understanding how paper recycling works and its positive environmental impact. Tips for reducing paper waste in daily life.', 'https://example.com/paper-recycling', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 'Japanese Washi Paper Making', 'Explore the traditional art of Japanese washi paper making. History, techniques, and where to find authentic washi paper products.', 'https://example.com/washi-paper', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 'Paper Craft Ideas for Kids', 'Fun and easy paper craft projects for children. Step-by-step instructions for creating animals, decorations, and more from simple paper.', 'https://example.com/kids-crafts', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Seed data: 10 ratings
-- Link 1 (alice): bob+, charlie+, alice+ = +3 aggregate → alice gains 3 points
-- Link 2 (alice): bob+, charlie+, alice+ = +3 aggregate → alice gains 3 points
-- Link 3 (bob): alice+, charlie- = 0 aggregate → bob gains 0 points
-- Link 4 (bob): alice+, charlie- = 0 aggregate → bob gains 0 points
-- Link 5 (charlie): No ratings (as required) → charlie gains 0 points
-- Total: alice = +6, bob = 0, charlie = 0

INSERT INTO ratings (link_id, member_id, is_positive, created_at) VALUES
-- Link 1 ratings (3 positive)
(1, 2, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),   -- bob rates link 1 positive
(1, 3, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),   -- charlie rates link 1 positive
(1, 1, true, CURRENT_TIMESTAMP - INTERVAL '3 days'),   -- alice rates link 1 positive
-- Link 2 ratings (3 positive)
(2, 2, true, CURRENT_TIMESTAMP - INTERVAL '3 days'),   -- bob rates link 2 positive
(2, 3, true, CURRENT_TIMESTAMP - INTERVAL '3 days'),   -- charlie rates link 2 positive
(2, 1, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),   -- alice rates link 2 positive
-- Link 3 ratings (1 positive, 1 negative)
(3, 1, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),   -- alice rates link 3 positive
(3, 3, false, CURRENT_TIMESTAMP - INTERVAL '2 days'),  -- charlie rates link 3 negative
-- Link 4 ratings (1 positive, 1 negative)
(4, 1, true, CURRENT_TIMESTAMP - INTERVAL '1 day'),    -- alice rates link 4 positive
(4, 3, false, CURRENT_TIMESTAMP - INTERVAL '1 day');  -- charlie rates link 4 negative
-- Link 5: No ratings (as required)

-- Update member points based on ratings
-- Alice's links: link 1 (+3), link 2 (+3) = +6 points
-- Bob's links: link 3 (0), link 4 (0) = 0 points
-- Charlie's links: link 5 (0) = 0 points
UPDATE members SET points = 6 WHERE id = 1;
UPDATE members SET points = 0 WHERE id = 2;
UPDATE members SET points = 0 WHERE id = 3;

-- Summary:
-- 3 members: alice, bob, charlie (password: "password" for all)
-- 5 links: 2 by alice, 2 by bob, 1 by charlie
-- 10 ratings: 6 positive, 4 negative
-- Link 5 has no ratings (as required)
-- Alice has 6 Paper Points, bob and charlie have 0
