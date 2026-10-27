-- Starting catalogue. Prices are in pence (GBP) and editable from /admin/packages.
--
-- Pricing rationale (UK, late 2026): freelance short-form editors charge
-- roughly £25–£60/hour, and 1-1 creative coaching sits around £60–£100/hour.
-- Self-paced editing courses from individual creators sell for £40–£400.

insert into public.packages
  (slug, kind, title, tagline, description, price_pence, features, duration_minutes, sessions, includes_discord, highlight, sort)
values
  ('capcut-fundamentals', 'course', 'CapCut Fundamentals',
   'Edit scroll-stopping shorts from your phone.',
   'The fastest way in. Learn the CapCut workflow behind high-retention Shorts, Reels and TikToks — hooks, cuts, captions, sound and export settings.',
   4900,
   array['14 bite-size video lessons', 'Hook & pacing formulas', 'Auto-captions that actually look good', 'Sound design basics', 'Lifetime access'],
   null, 1, false, false, 10),

  ('short-form-pro', 'course', 'Short-Form Pro',
   'Premiere Pro + CapCut — the full creator workflow.',
   'The complete system gxo uses for client work: project setup in Premiere Pro, fast rough cuts, retention editing, motion text, colour and sound, then finishing in CapCut. Includes the Discord community.',
   14900,
   array['Everything in CapCut Fundamentals', '40+ lessons across Premiere Pro & CapCut', 'Retention editing & motion text', 'Colour & sound design', 'Presets, SFX & template pack', 'Private Discord community'],
   null, 1, true, true, 20),

  ('agency-track', 'course', 'Agency Track',
   'Edit for clients and get paid for it.',
   'For editors who want to work for creators and brands — including gxo''s own team. Everything in Short-Form Pro plus the business side: portfolio, pricing, client briefs, revisions and delivery.',
   34900,
   array['Everything in Short-Form Pro', 'Portfolio & pricing playbook', 'Client brief → delivery workflow', 'Recorded portfolio review', 'Priority team application', 'Private Discord community'],
   null, 1, true, false, 30),

  ('quick-fix', 'mentoring', 'Quick Fix',
   '30 minutes, one problem solved.',
   'Bring an edit, a Premiere/CapCut problem or a question about your channel. Screen-share call.',
   4000,
   array['30-minute 1-1 video call', 'Screen-share feedback', 'Notes sent after the call'],
   30, 1, false, false, 40),

  ('deep-dive', 'mentoring', 'Deep Dive',
   'An hour of 1-1 editing mentorship.',
   'Edit along with gxo, get your workflow reviewed and leave with a plan for your next ten videos.',
   7500,
   array['60-minute 1-1 video call', 'Live edit-along or edit review', 'Personal action plan'],
   60, 1, false, true, 50),

  ('mentorship-pack', 'mentoring', 'Mentorship Pack',
   'Four 60-minute sessions — save £40.',
   'A month of weekly sessions to level up properly. Book the first one here; the rest are scheduled with gxo on the call.',
   26000,
   array['4 × 60-minute 1-1 calls', 'Weekly edit reviews', 'Direct WhatsApp support between calls', 'Discord community access'],
   60, 4, true, false, 60);

-- Curriculum outlines. Add video URLs from /admin/packages when lessons are recorded.
with c as (select id, slug from public.packages where kind = 'course')
insert into public.lessons (package_id, section, title, summary, duration_minutes, is_preview, sort)
select c.id, l.section, l.title, l.summary, l.mins, l.preview, l.sort
from c
join (values
  ('capcut-fundamentals', 'Start here', 'Welcome & how short-form works', 'What makes people stop scrolling — and stay.', 6, true, 10),
  ('capcut-fundamentals', 'Start here', 'CapCut setup & project settings', 'Canvas, frame rate and the settings that matter.', 8, false, 20),
  ('capcut-fundamentals', 'Cutting', 'The 3-second hook', 'Open strong: hook patterns that work in 2026.', 10, false, 30),
  ('capcut-fundamentals', 'Cutting', 'Jump cuts & pacing', 'Remove the dead air without making it feel choppy.', 12, false, 40),
  ('capcut-fundamentals', 'Polish', 'Captions that pop', 'Auto-captions, styling and keyword highlights.', 9, false, 50),
  ('capcut-fundamentals', 'Polish', 'Sound design basics', 'SFX, music ducking and whooshes.', 11, false, 60),
  ('capcut-fundamentals', 'Polish', 'Export settings', 'Quality settings for Shorts, Reels and TikTok.', 5, false, 70),

  ('short-form-pro', 'Premiere Pro', 'Project setup & proxies', 'A clean, fast Premiere Pro project every time.', 12, true, 10),
  ('short-form-pro', 'Premiere Pro', 'Rough cut at speed', 'Keyboard-first cutting and ripple edits.', 15, false, 20),
  ('short-form-pro', 'Premiere Pro', 'Retention editing', 'Pattern interrupts, zooms and B-roll timing.', 18, false, 30),
  ('short-form-pro', 'Premiere Pro', 'Motion text & graphics', 'Essential Graphics and animated captions.', 16, false, 40),
  ('short-form-pro', 'Premiere Pro', 'Colour', 'Lumetri basics to a consistent look.', 14, false, 50),
  ('short-form-pro', 'CapCut finishing', 'Round-tripping to CapCut', 'When to finish in CapCut and how to move projects.', 10, false, 60),
  ('short-form-pro', 'CapCut finishing', 'Effects, transitions & templates', 'Use trends without looking like everyone else.', 12, false, 70),
  ('short-form-pro', 'CapCut finishing', 'Sound design deep-dive', 'Layering SFX and music for impact.', 13, false, 80),

  ('agency-track', 'Business', 'Building a portfolio that sells', 'What clients look for in 10 seconds.', 12, true, 10),
  ('agency-track', 'Business', 'Pricing your edits', 'Per-video, retainers and packages.', 14, false, 20),
  ('agency-track', 'Business', 'Briefs, revisions & delivery', 'A client workflow that avoids endless revisions.', 15, false, 30),
  ('agency-track', 'Business', 'Working on the gxo team', 'Standards, file handoff and how we work in Discord.', 10, false, 40)
) as l(slug, section, title, summary, mins, preview, sort) on l.slug = c.slug;

update public.packages set bundles = array['capcut-fundamentals'] where slug = 'short-form-pro';
update public.packages set bundles = array['capcut-fundamentals', 'short-form-pro'] where slug = 'agency-track';
