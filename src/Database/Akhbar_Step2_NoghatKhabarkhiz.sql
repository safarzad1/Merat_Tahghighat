USE [MeratDB]
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Akhbar')
    EXEC(N'CREATE SCHEMA [Akhbar] AUTHORIZATION [dbo]');
GO

/* ============================================================
   نقاط خبرخیز به تفکیک محل (Mahal)
   ============================================================ */
IF OBJECT_ID(N'[Akhbar].[NoghatKhabarkhiz]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[NoghatKhabarkhiz](
        [NoghteKhabarkhizId] BIGINT IDENTITY(1,1) NOT NULL,
        [Mahal] INT NOT NULL,
        [Onvan] NVARCHAR(300) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_Akhbar_NoghatKhabarkhiz_IsActive] DEFAULT(1),
        [CreateUserId] BIGINT NOT NULL,
        [CreateDateTime] NVARCHAR(20) NOT NULL,
        [LastEditUserId] BIGINT NULL,
        [LastEditDateTime] NVARCHAR(20) NULL,
        CONSTRAINT [PK_Akhbar_NoghatKhabarkhiz] PRIMARY KEY CLUSTERED ([NoghteKhabarkhizId] ASC)
    );
END
ELSE
BEGIN
    IF COL_LENGTH(N'Akhbar.NoghatKhabarkhiz', N'Mahal') IS NULL
        ALTER TABLE [Akhbar].[NoghatKhabarkhiz] ADD [Mahal] INT NULL;
END
GO

/* اگر جدول از نسخه قبلی وجود داشته و رکورد بدون Mahal دارد،
   Mahal را از کاربر ایجادکننده بازیابی می‌کنیم. */
UPDATE N
SET N.[Mahal] = U.[Mahal]
FROM [Akhbar].[NoghatKhabarkhiz] N
INNER JOIN [dbo].[Users] U ON U.[UserId] = N.[CreateUserId]
WHERE N.[Mahal] IS NULL;
GO

/* در صورتی که رکورد قدیمی بدون CreateUserId وجود داشته باشد،
   ابتدا باید Mahal آن رکوردها دستی تعیین شود؛ سپس NOT NULL می‌شود. */
IF NOT EXISTS (SELECT 1 FROM [Akhbar].[NoghatKhabarkhiz] WHERE [Mahal] IS NULL)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'[Akhbar].[NoghatKhabarkhiz]')
          AND name = N'Mahal'
          AND is_nullable = 1
    )
        ALTER TABLE [Akhbar].[NoghatKhabarkhiz] ALTER COLUMN [Mahal] INT NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Akhbar_NoghatKhabarkhiz_Mahal_IsActive_Onvan'
      AND object_id = OBJECT_ID(N'[Akhbar].[NoghatKhabarkhiz]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Akhbar_NoghatKhabarkhiz_Mahal_IsActive_Onvan]
    ON [Akhbar].[NoghatKhabarkhiz]([Mahal], [IsActive], [Onvan])
    INCLUDE ([NoghteKhabarkhizId]);
END
GO

/* ============================================================
   ثبت نقطه خبرخیز جدید برای محل همان کاربر
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_InsertNoghteKhabarkhiz]
    @Onvan NVARCHAR(300),
    @CreateUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Mahal INT;

    SELECT @Mahal = [Mahal]
    FROM [dbo].[Users]
    WHERE [UserId] = @CreateUserId
      AND [IsActive] = 1;

    IF @Mahal IS NULL
        THROW 51000, N'کاربر فعال یا محل کاربر یافت نشد.', 1;

    SET @Onvan = NULLIF(LTRIM(RTRIM(@Onvan)), N'');

    IF @Onvan IS NULL
        THROW 51000, N'عنوان نقطه خبرخیز اجباری است.', 1;

    IF EXISTS (
        SELECT 1
        FROM [Akhbar].[NoghatKhabarkhiz]
        WHERE [Mahal] = @Mahal
          AND [Onvan] = @Onvan
          AND [IsActive] = 1
    )
        THROW 51000, N'این نقطه خبرخیز قبلاً برای محل شما ثبت شده است.', 1;

    INSERT INTO [Akhbar].[NoghatKhabarkhiz]
    (
        [Mahal], [Onvan], [IsActive], [CreateUserId], [CreateDateTime]
    )
    VALUES
    (
        @Mahal, @Onvan, 1, @CreateUserId, [dbo].[FarsiDateTimeNow]()
    );

    DECLARE @Id BIGINT = SCOPE_IDENTITY();

    SELECT
        [NoghteKhabarkhizId], [Mahal], [Onvan]
    FROM [Akhbar].[NoghatKhabarkhiz]
    WHERE [NoghteKhabarkhizId] = @Id;
END
GO

/* ============================================================
   دریافت Lookupها؛ نقاط خبرخیز فقط برای محل همان کاربر
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarLookups]
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Mahal INT;

    SELECT @Mahal = [Mahal]
    FROM [dbo].[Users]
    WHERE [UserId] = @UserId
      AND [IsActive] = 1;

    IF @Mahal IS NULL
        THROW 51000, N'کاربر فعال یا محل کاربر یافت نشد.', 1;

    SELECT [ManbaKhabarId], [Onvan]
    FROM [Akhbar].[ManabeKhabar]
    WHERE [IsActive] = 1
    ORDER BY [Onvan];

    SELECT [NoghteKhabarkhizId], [Mahal], [Onvan]
    FROM [Akhbar].[NoghatKhabarkhiz]
    WHERE [IsActive] = 1
      AND [Mahal] = @Mahal
    ORDER BY [Onvan];
END
GO

/* ============================================================
   INSERT خبر - نقطه خبرخیز باید متعلق به محل ایجادکننده باشد
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_InsertKhabar]
    @TabaqehBandi TINYINT,
    @ManbaKhabarId INT,
    @NoeKhabar TINYINT,
    @TarikhNameh NCHAR(10) = NULL,
    @ShomareNameh NVARCHAR(100) = NULL,
    @OnvanKhabar NVARCHAR(500),
    @SharhKhabar NVARCHAR(MAX),
    @MolahazatKhabar NVARCHAR(MAX),
    @NoghteKhabarkhizId BIGINT = NULL,
    @MahalNoghteKhabarkhiz NVARCHAR(500) = NULL,
    @TarikhEnteshar NCHAR(10) = NULL,
    @CreateUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CreateMahal INT, @CreatePostId INT;

    SELECT
        @CreateMahal = [Mahal],
        @CreatePostId = [PostId]
    FROM [dbo].[Users]
    WHERE [UserId] = @CreateUserId
      AND [IsActive] = 1;

    IF @CreateMahal IS NULL OR @CreatePostId IS NULL
        THROW 51000, N'کاربر فعال برای ثبت خبر یافت نشد.', 1;

    IF @TabaqehBandi NOT IN (1,2,3)
        THROW 51000, N'طبقه‌بندی خبر نامعتبر است.', 1;

    IF @NoeKhabar NOT IN (1,2,3,4)
        THROW 51000, N'نوع خبر نامعتبر است.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM [Akhbar].[ManabeKhabar]
        WHERE [ManbaKhabarId] = @ManbaKhabarId AND [IsActive] = 1
    )
        THROW 51000, N'منبع خبر معتبر نیست.', 1;

    IF @NoghteKhabarkhizId IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM [Akhbar].[NoghatKhabarkhiz]
            WHERE [NoghteKhabarkhizId] = @NoghteKhabarkhizId
              AND [Mahal] = @CreateMahal
              AND [IsActive] = 1
       )
        THROW 51000, N'نقطه خبرخیز انتخاب‌شده متعلق به محل شما نیست یا غیرفعال است.', 1;

    IF NULLIF(LTRIM(RTRIM(@OnvanKhabar)), N'') IS NULL
        THROW 51000, N'عنوان خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@SharhKhabar)), N'') IS NULL
        THROW 51000, N'شرح خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@MolahazatKhabar)), N'') IS NULL
        THROW 51000, N'ملاحظات خبر اجباری است.', 1;

    IF @NoghteKhabarkhizId IS NULL
       AND NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N'') IS NULL
        THROW 51000, N'در صورت عدم انتخاب نقطه خبرخیز، محل نقطه خبرخیز اجباری است.', 1;

    INSERT INTO [Akhbar].[Khabar]
    (
        [TabaqehBandi], [ManbaKhabarId], [NoeKhabar],
        [TarikhNameh], [ShomareNameh], [OnvanKhabar], [SharhKhabar], [MolahazatKhabar],
        [NoghteKhabarkhizId], [MahalNoghteKhabarkhiz], [TarikhEnteshar],
        [CreateMahal], [CreatePostId], [CreateUserId], [CreateDateTime], [IsDelete]
    )
    VALUES
    (
        @TabaqehBandi, @ManbaKhabarId, @NoeKhabar,
        NULLIF(LTRIM(RTRIM(@TarikhNameh)), N''),
        NULLIF(LTRIM(RTRIM(@ShomareNameh)), N''),
        LTRIM(RTRIM(@OnvanKhabar)), @SharhKhabar, @MolahazatKhabar,
        @NoghteKhabarkhizId,
        NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N''),
        NULLIF(LTRIM(RTRIM(@TarikhEnteshar)), N''),
        @CreateMahal, @CreatePostId, @CreateUserId, [dbo].[FarsiDateTimeNow](), 0
    );

    DECLARE @ShomareKhabar BIGINT = SCOPE_IDENTITY();
    SELECT @ShomareKhabar AS [ShomareKhabar];
END
GO

/* ============================================================
   UPDATE خبر - نقطه خبرخیز باید متعلق به محل کاربر ویرایش‌کننده باشد
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_UpdateKhabar]
    @ShomareKhabar BIGINT,
    @TabaqehBandi TINYINT,
    @ManbaKhabarId INT,
    @NoeKhabar TINYINT,
    @TarikhNameh NCHAR(10) = NULL,
    @ShomareNameh NVARCHAR(100) = NULL,
    @OnvanKhabar NVARCHAR(500),
    @SharhKhabar NVARCHAR(MAX),
    @MolahazatKhabar NVARCHAR(MAX),
    @NoghteKhabarkhizId BIGINT = NULL,
    @MahalNoghteKhabarkhiz NVARCHAR(500) = NULL,
    @TarikhEnteshar NCHAR(10) = NULL,
    @LastEditUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserMahal INT;

    SELECT @UserMahal = [Mahal]
    FROM [dbo].[Users]
    WHERE [UserId] = @LastEditUserId
      AND [IsActive] = 1;

    IF @UserMahal IS NULL
        THROW 51000, N'کاربر فعال یا محل کاربر یافت نشد.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM [Akhbar].[Khabar]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [CreateUserId] = @LastEditUserId
          AND [IsDelete] = 0
    )
        THROW 51000, N'خبر یافت نشد یا اجازه ویرایش آن را ندارید.', 1;

    IF @TabaqehBandi NOT IN (1,2,3)
        THROW 51000, N'طبقه‌بندی خبر نامعتبر است.', 1;

    IF @NoeKhabar NOT IN (1,2,3,4)
        THROW 51000, N'نوع خبر نامعتبر است.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM [Akhbar].[ManabeKhabar]
        WHERE [ManbaKhabarId] = @ManbaKhabarId AND [IsActive] = 1
    )
        THROW 51000, N'منبع خبر معتبر نیست.', 1;

    IF @NoghteKhabarkhizId IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM [Akhbar].[NoghatKhabarkhiz]
            WHERE [NoghteKhabarkhizId] = @NoghteKhabarkhizId
              AND [Mahal] = @UserMahal
              AND [IsActive] = 1
       )
        THROW 51000, N'نقطه خبرخیز انتخاب‌شده متعلق به محل شما نیست یا غیرفعال است.', 1;

    IF NULLIF(LTRIM(RTRIM(@OnvanKhabar)), N'') IS NULL
        THROW 51000, N'عنوان خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@SharhKhabar)), N'') IS NULL
        THROW 51000, N'شرح خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@MolahazatKhabar)), N'') IS NULL
        THROW 51000, N'ملاحظات خبر اجباری است.', 1;

    IF @NoghteKhabarkhizId IS NULL
       AND NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N'') IS NULL
        THROW 51000, N'در صورت عدم انتخاب نقطه خبرخیز، محل نقطه خبرخیز اجباری است.', 1;

    UPDATE [Akhbar].[Khabar]
    SET [TabaqehBandi] = @TabaqehBandi,
        [ManbaKhabarId] = @ManbaKhabarId,
        [NoeKhabar] = @NoeKhabar,
        [TarikhNameh] = NULLIF(LTRIM(RTRIM(@TarikhNameh)), N''),
        [ShomareNameh] = NULLIF(LTRIM(RTRIM(@ShomareNameh)), N''),
        [OnvanKhabar] = LTRIM(RTRIM(@OnvanKhabar)),
        [SharhKhabar] = @SharhKhabar,
        [MolahazatKhabar] = @MolahazatKhabar,
        [NoghteKhabarkhizId] = @NoghteKhabarkhizId,
        [MahalNoghteKhabarkhiz] = NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N''),
        [TarikhEnteshar] = NULLIF(LTRIM(RTRIM(@TarikhEnteshar)), N''),
        [LastEditUserId] = @LastEditUserId,
        [LastEditDateTime] = [dbo].[FarsiDateTimeNow]()
    WHERE [ShomareKhabar] = @ShomareKhabar
      AND [CreateUserId] = @LastEditUserId
      AND [IsDelete] = 0;

    SELECT @ShomareKhabar AS [ShomareKhabar];
END
GO
