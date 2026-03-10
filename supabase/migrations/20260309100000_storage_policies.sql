-- Storage RLS policies for selfies and wardrobe buckets
-- Users can upload to their own folder (user_id/filename)
-- Service role (edge functions) can read any file

create policy "users can upload own selfies"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can read own selfies"
  on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can upload own wardrobe"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can read own wardrobe"
  on storage.objects for select to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
