USE [MeratDB]
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Akhbar')
    EXEC(N'CREATE SCHEMA [Akhbar] AUTHORIZATION [dbo]');
GO

/* ============================================================
   اشخاص وابسته به خبر
   ============================================================ */
IF OBJECT_ID(N'[Akhbar].[KhabarAshkhas]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[KhabarAshkhas](
        [KhabarShakhsId] BIGINT IDENTITY(1,1) NOT NULL,
        [ShomareKhabar] BIGINT NOT NULL,
        [ShomarehParvandeh] BIGINT NOT NULL,
        [IsDelete] BIT NOT NULL CONSTRAINT [DF_Akhbar_KhabarAshkhas_IsDelete] DEFAULT(0),
        [CreateUserId] BIGINT NOT NULL,
        [CreateDateTime] NVARCHAR(20) NOT NULL,
        [LastEditUserId] BIGINT NULL,
        [LastEditDateTime] NVARCHAR(20) NULL,
        CONSTRAINT [PK_Akhbar_KhabarAshkhas] PRIMARY KEY CLUSTERED ([KhabarShakhsId] ASC),
        CONSTRAINT [FK_Akhbar_KhabarAshkhas_Khabar] FOREIGN KEY ([ShomareKhabar])
            REFERENCES [Akhbar].[Khabar]([ShomareKhabar]),
        CONSTRAINT [FK_Akhbar_KhabarAshkhas_Ashkhas] FOREIGN KEY ([ShomarehParvandeh])
            REFERENCES [Davtalab].[Ashkhas]([ShomarehParvandeh])
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'UX_Akhbar_KhabarAshkhas_Active'
      AND object_id = OBJECT_ID(N'[Akhbar].[KhabarAshkhas]')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_Akhbar_KhabarAshkhas_Active]
    ON [Akhbar].[KhabarAshkhas]([ShomareKhabar], [ShomarehParvandeh])
    WHERE [IsDelete] = 0;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Akhbar_KhabarAshkhas_Khabar'
      AND object_id = OBJECT_ID(N'[Akhbar].[KhabarAshkhas]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Akhbar_KhabarAshkhas_Khabar]
    ON [Akhbar].[KhabarAshkhas]([ShomareKhabar], [IsDelete], [KhabarShakhsId])
    INCLUDE ([ShomarehParvandeh], [CreateUserId], [CreateDateTime]);
END
GO

/* ============================================================
   ایندکس‌های جستجوی سریع فقط روی سه فیلد مورد نیاز:
   FirstName / LastName / NamePedar
   ============================================================ */
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Davtalab_Ashkhas_FirstName_Search'
      AND object_id = OBJECT_ID(N'[Davtalab].[Ashkhas]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Davtalab_Ashkhas_FirstName_Search]
    ON [Davtalab].[Ashkhas]([FirstName], [IsDelete])
    INCLUDE ([ShomarehParvandeh], [LastName], [NamePedar]);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Davtalab_Ashkhas_LastName_Search'
      AND object_id = OBJECT_ID(N'[Davtalab].[Ashkhas]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Davtalab_Ashkhas_LastName_Search]
    ON [Davtalab].[Ashkhas]([LastName], [IsDelete])
    INCLUDE ([ShomarehParvandeh], [FirstName], [NamePedar]);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Davtalab_Ashkhas_NamePedar_Search'
      AND object_id = OBJECT_ID(N'[Davtalab].[Ashkhas]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Davtalab_Ashkhas_NamePedar_Search]
    ON [Davtalab].[Ashkhas]([NamePedar], [IsDelete])
    INCLUDE ([ShomarehParvandeh], [FirstName], [LastName]);
END
GO

/* ============================================================
   جستجوی SQL-side و صفحه‌بندی‌شده اشخاص
   - فقط نام، نام خانوادگی و نام پدر
   - NormalizePersianText فقط روی متن ورودی
   - جستجو Prefix برای استفاده بهتر از ایندکس
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_SearchAshkhas]
    @ShomareKhabar BIGINT,
    @UserId BIGINT,
    @Search NVARCHAR(150),
    @Page INT = 1,
    @SizePage INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    SET @Page = CASE WHEN ISNULL(@Page, 0) < 1 THEN 1 ELSE @Page END;
    SET @SizePage = CASE
                        WHEN ISNULL(@SizePage, 0) < 1 THEN 10
                        WHEN @SizePage > 50 THEN 50
                        ELSE @SizePage
                    END;

    SET @Search = LTRIM(RTRIM([dbo].[NormalizePersianText](ISNULL(@Search, N''))));

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [IsDelete] = 0
          AND [CreateUserId] = @UserId
    )
        THROW 51000, N'خبر یافت نشد یا دسترسی مجاز نیست.', 1;

    IF LEN(@Search) < 2
    BEGIN
        SELECT TOP (0)
            CAST(NULL AS BIGINT) AS [ShomarehParvandeh],
            CAST(NULL AS NVARCHAR(50)) AS [FirstName],
            CAST(NULL AS NVARCHAR(150)) AS [LastName],
            CAST(NULL AS NVARCHAR(50)) AS [NamePedar],
            CAST(0 AS BIGINT) AS [TotalCount];
        RETURN;
    END;

    DECLARE @Tokens TABLE
    (
        [Token] NVARCHAR(100) NOT NULL PRIMARY KEY
    );

    INSERT INTO @Tokens ([Token])
    SELECT DISTINCT LTRIM(RTRIM([value]))
    FROM STRING_SPLIT(@Search, N' ')
    WHERE LEN(LTRIM(RTRIM([value]))) > 0;

    ;WITH Q AS
    (
        SELECT
            a.[ShomarehParvandeh],
            a.[FirstName],
            a.[LastName],
            a.[NamePedar]
        FROM [Davtalab].[Ashkhas] a
        WHERE ISNULL(a.[IsDelete], 0) = 0
          AND NOT EXISTS
          (
              SELECT 1
              FROM @Tokens t
              WHERE NOT
              (
                     a.[FirstName] LIKE t.[Token] + N'%'
                  OR a.[LastName]  LIKE t.[Token] + N'%'
                  OR a.[NamePedar] LIKE t.[Token] + N'%'
              )
          )
          AND NOT EXISTS
          (
              SELECT 1
              FROM [Akhbar].[KhabarAshkhas] ka
              WHERE ka.[ShomareKhabar] = @ShomareKhabar
                AND ka.[ShomarehParvandeh] = a.[ShomarehParvandeh]
                AND ka.[IsDelete] = 0
          )
    )
    SELECT
        q.[ShomarehParvandeh],
        q.[FirstName],
        q.[LastName],
        q.[NamePedar],
        COUNT_BIG(1) OVER() AS [TotalCount]
    FROM Q q
    ORDER BY q.[LastName], q.[FirstName], q.[NamePedar], q.[ShomarehParvandeh]
    OFFSET (@Page - 1) * @SizePage ROWS
    FETCH NEXT @SizePage ROWS ONLY
    OPTION (RECOMPILE);
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarAshkhas]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [IsDelete] = 0
          AND [CreateUserId] = @UserId
    )
    BEGIN
        THROW 51000, N'خبر یافت نشد یا دسترسی مجاز نیست.', 1;
    END

    SELECT
        ka.[KhabarShakhsId],
        ka.[ShomarehParvandeh],
        a.[FirstName],
        a.[LastName],
        a.[NamePedar],
        ka.[CreateDateTime]
    FROM [Akhbar].[KhabarAshkhas] ka
    INNER JOIN [Davtalab].[Ashkhas] a
        ON a.[ShomarehParvandeh] = ka.[ShomarehParvandeh]
    WHERE ka.[ShomareKhabar] = @ShomareKhabar
      AND ka.[IsDelete] = 0
    ORDER BY ka.[KhabarShakhsId] DESC;
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_InsertKhabarShakhs]
    @ShomareKhabar BIGINT,
    @ShomarehParvandeh BIGINT,
    @CreateUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [IsDelete] = 0
          AND [CreateUserId] = @CreateUserId
    )
        THROW 51000, N'خبر یافت نشد یا دسترسی مجاز نیست.', 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Davtalab].[Ashkhas]
        WHERE [ShomarehParvandeh] = @ShomarehParvandeh
          AND ISNULL([IsDelete], 0) = 0
    )
        THROW 51000, N'شخص مورد نظر یافت نشد.', 1;

    BEGIN TRAN;

    IF EXISTS
    (
        SELECT 1 FROM [Akhbar].[KhabarAshkhas]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [ShomarehParvandeh] = @ShomarehParvandeh
          AND [IsDelete] = 1
    )
    BEGIN
        UPDATE [Akhbar].[KhabarAshkhas]
        SET [IsDelete] = 0,
            [LastEditUserId] = @CreateUserId,
            [LastEditDateTime] = [dbo].[FarsiDateTimeNow]()
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [ShomarehParvandeh] = @ShomarehParvandeh
          AND [IsDelete] = 1;
    END
    ELSE IF NOT EXISTS
    (
        SELECT 1 FROM [Akhbar].[KhabarAshkhas]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [ShomarehParvandeh] = @ShomarehParvandeh
          AND [IsDelete] = 0
    )
    BEGIN
        INSERT INTO [Akhbar].[KhabarAshkhas]
        (
            [ShomareKhabar], [ShomarehParvandeh], [IsDelete],
            [CreateUserId], [CreateDateTime]
        )
        VALUES
        (
            @ShomareKhabar, @ShomarehParvandeh, 0,
            @CreateUserId, [dbo].[FarsiDateTimeNow]()
        );
    END

    COMMIT;

    SELECT TOP (1)
        ka.[KhabarShakhsId], ka.[ShomarehParvandeh],
        a.[FirstName], a.[LastName], a.[NamePedar]
    FROM [Akhbar].[KhabarAshkhas] ka
    INNER JOIN [Davtalab].[Ashkhas] a ON a.[ShomarehParvandeh] = ka.[ShomarehParvandeh]
    WHERE ka.[ShomareKhabar] = @ShomareKhabar
      AND ka.[ShomarehParvandeh] = @ShomarehParvandeh
      AND ka.[IsDelete] = 0;
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_DeleteKhabarShakhs]
    @KhabarShakhsId BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ka
    SET ka.[IsDelete] = 1,
        ka.[LastEditUserId] = @UserId,
        ka.[LastEditDateTime] = [dbo].[FarsiDateTimeNow]()
    FROM [Akhbar].[KhabarAshkhas] ka
    INNER JOIN [Akhbar].[Khabar] k ON k.[ShomareKhabar] = ka.[ShomareKhabar]
    WHERE ka.[KhabarShakhsId] = @KhabarShakhsId
      AND ka.[IsDelete] = 0
      AND k.[IsDelete] = 0
      AND k.[CreateUserId] = @UserId;

    IF @@ROWCOUNT = 0
        THROW 51000, N'رکورد یافت نشد یا دسترسی مجاز نیست.', 1;

    SELECT CAST(1 AS BIT) AS [IsDeleted];
END
GO
