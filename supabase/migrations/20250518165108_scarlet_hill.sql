/*
  # Update service images with better photos

  1. Changes
    - Update image URLs for Acrylic Full Set and Nail Art services
    - Use more professional and relevant photos from Pexels
*/

UPDATE services
SET image_url = CASE name
  WHEN 'Acrylic Full Set' THEN 'https://images.pexels.com/photos/3997388/pexels-photo-3997388.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  WHEN 'Nail Art' THEN 'https://images.pexels.com/photos/3997384/pexels-photo-3997384.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  ELSE image_url
END
WHERE name IN ('Acrylic Full Set', 'Nail Art');