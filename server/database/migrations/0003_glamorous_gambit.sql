DO $$ BEGIN
    -- ALTER COLUMN doesn't have a simple IF NOT EXISTS in standard SQL, but we can check the data type
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'api_tokens' AND column_name = 'prefix') <> 'character varying' OR 
       (SELECT character_maximum_length FROM information_schema.columns WHERE table_name = 'api_tokens' AND column_name = 'prefix') <> 32 THEN
        ALTER TABLE "api_tokens" ALTER COLUMN "prefix" SET DATA TYPE varchar(32);
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='category') THEN
        ALTER TABLE "segments" ADD COLUMN "category" varchar(50);
    END IF;
END $$;