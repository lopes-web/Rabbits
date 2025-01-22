-- Drop existing constraint if it exists
alter table habit_checks
  drop constraint if exists habit_checks_habit_id_date_key;

-- Add the constraint back
alter table habit_checks
  add constraint habit_checks_habit_id_date_key unique (habit_id, date); 