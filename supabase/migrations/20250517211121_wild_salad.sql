/*
  # Update service images with high-quality photos

  1. Changes
    - Update image URLs for all services with professional nail photos from Pexels
    - Each image is carefully selected to match the service type
*/

UPDATE services
SET image_url = CASE name
  WHEN 'Classic Manicure' THEN 'https://images.pexels.com/photos/3997385/pexels-photo-3997385.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  WHEN 'Gel Manicure' THEN 'https://images.pexels.com/photos/3997386/pexels-photo-3997386.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  WHEN 'Nail Art' THEN 'https://images.pexels.com/photos/7755256/pexels-photo-7755256.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  WHEN 'Classic Pedicure' THEN 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  WHEN 'Gel Pedicure' THEN 'https://images.pexels.com/photos/3997389/pexels-photo-3997389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  WHEN 'Acrylic Full Set' THEN 'https://images.pexels.com/photos/7755255/pexels-photo-7755255.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  ELSE image_url
END;