-- Data migration: Move project data from attachments to proper fields
-- This script migrates existing project data from the JSON in attachments array 
-- to the new dedicated columns

DO $$
DECLARE
    idea_record RECORD;
    project_data JSONB;
    attachment_text TEXT;
BEGIN
    -- Loop through all ideas that have attachments
    FOR idea_record IN 
        SELECT id, attachments 
        FROM ideas 
        WHERE attachments IS NOT NULL 
        AND array_length(attachments, 1) > 0
    LOOP
        BEGIN
            -- Get the first attachment (which should be our project data JSON)
            attachment_text := idea_record.attachments[1];
            
            -- Try to parse as JSON
            project_data := attachment_text::JSONB;
            
            -- Check if it has our project data structure
            IF project_data ? 'repository_url' OR project_data ? 'demo_url' OR project_data ? 'project_attachments' THEN
                -- Update the idea with the extracted data
                UPDATE ideas 
                SET 
                    repository_url = COALESCE((project_data->>'repository_url'), ''),
                    demo_url = COALESCE((project_data->>'demo_url'), ''),
                    project_attachments = COALESCE((project_data->>'project_attachments'), '[]'),
                    updated_at = NOW()
                WHERE id = idea_record.id;
                
                RAISE NOTICE 'Migrated project data for idea %', idea_record.id;
            END IF;
            
        EXCEPTION 
            WHEN OTHERS THEN
                -- Skip ideas where JSON parsing fails
                RAISE NOTICE 'Skipped idea % - could not parse attachment as JSON: %', idea_record.id, SQLERRM;
                CONTINUE;
        END;
    END LOOP;
    
    RAISE NOTICE 'Project data migration completed';
END $$;
