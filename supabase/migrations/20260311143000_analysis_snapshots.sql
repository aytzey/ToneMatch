alter table public.analysis_sessions
  add column if not exists result_json jsonb not null default '{}'::jsonb;

alter table public.style_profiles
  add column if not exists analysis_snapshot_json jsonb not null default '{}'::jsonb;

update public.style_profiles
set analysis_snapshot_json = jsonb_build_object(
  'undertone', undertone_label,
  'contrast', contrast_label,
  'confidence', round(((coalesce(undertone_confidence, 0) + coalesce(contrast_confidence, 0)) / 2)::numeric, 2),
  'summary', jsonb_build_object(
    'title', undertone_label || ' / ' || contrast_label,
    'description', coalesce(fit_explanation, '')
  ),
  'focusItems', jsonb_build_array(
    jsonb_build_object(
      'title', 'Latest saved analysis',
      'copy', coalesce(fit_explanation, 'Your latest analysis has been linked to this profile.')
    )
  ),
  'palette', jsonb_build_object(
    'core', coalesce(palette_json -> 'core', '[]'::jsonb),
    'avoid', coalesce(avoid_colors_json, '[]'::jsonb)
  ),
  'recommendations', '[]'::jsonb,
  'capturedAt', timezone('utc', now()),
  'sourceSessionId', source_analysis_session_id
)
where coalesce(analysis_snapshot_json, '{}'::jsonb) = '{}'::jsonb;

update public.analysis_sessions as sessions
set result_json = profiles.analysis_snapshot_json
from public.style_profiles as profiles
where profiles.source_analysis_session_id = sessions.id
  and coalesce(sessions.result_json, '{}'::jsonb) = '{}'::jsonb;
