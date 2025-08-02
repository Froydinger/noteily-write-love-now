-- Remove email notification functions and create in-app notification system
DROP FUNCTION IF EXISTS public.notify_note_shared();
DROP FUNCTION IF EXISTS public.notify_note_updated();

-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  note_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_updated_at();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to create in-app notifications when notes are shared
CREATE OR REPLACE FUNCTION public.notify_note_shared()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  note_title text;
  owner_email text;
BEGIN
  -- Get note title and owner email
  SELECT n.title, au.email INTO note_title, owner_email
  FROM public.notes n
  JOIN auth.users au ON au.id = n.user_id
  WHERE n.id = NEW.note_id;
  
  -- Create in-app notification for the recipient
  IF NEW.shared_with_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      note_id
    ) VALUES (
      NEW.shared_with_user_id,
      'note_shared',
      'Note shared with you',
      owner_email || ' shared the note "' || note_title || '" with you',
      NEW.note_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create function to create in-app notifications when notes are updated
CREATE OR REPLACE FUNCTION public.notify_note_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  share_record record;
  owner_email text;
BEGIN
  -- Only notify for actual content changes, not just timestamp updates
  IF OLD.content = NEW.content AND OLD.title = NEW.title THEN
    RETURN NEW;
  END IF;
  
  -- Get owner email
  SELECT au.email INTO owner_email
  FROM auth.users au
  WHERE au.id = NEW.user_id;
  
  -- Loop through all users who have access to this note
  FOR share_record IN 
    SELECT shared_with_user_id 
    FROM public.shared_notes 
    WHERE note_id = NEW.id AND shared_with_user_id IS NOT NULL
  LOOP
    -- Create in-app notification for each shared user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      note_id
    ) VALUES (
      share_record.shared_with_user_id,
      'note_updated',
      'Shared note updated',
      owner_email || ' updated the note "' || NEW.title || '"',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;