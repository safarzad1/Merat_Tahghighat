USE [MeratDB]
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Akhbar')
    EXEC(N'CREATE SCHEMA [Akhbar] AUTHORIZATION [dbo]');
GO

/* ============================================================
   جداول مرجع مورد نیاز دراپ‌دان‌ها
   مقادیر منبع خبر و نقطه خبرخیز بعداً طبق لیست نهایی شما درج می‌شوند.
   ============================================================ */
IF OBJECT_ID(N'[Akhbar].[ManabeKhabar]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[ManabeKhabar](
        [ManbaKhabarId] INT IDENTITY(1,1) NOT NULL,
        [Onvan] NVARCHAR(200) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_Akhbar_ManabeKhabar_IsActive] DEFAULT(1),
        [CreateUserId] BIGINT NULL,
        [CreateDateTime] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Akhbar_ManabeKhabar_CreateDateTime] DEFAULT([dbo].[FarsiDateTimeNow]()),
        [LastEditUserId] BIGINT NULL,
        [LastEditDateTime] NVARCHAR(20) NULL,
        CONSTRAINT [PK_Akhbar_ManabeKhabar] PRIMARY KEY CLUSTERED ([ManbaKhabarId] ASC)
    );
END
GO

IF OBJECT_ID(N'[Akhbar].[NoghatKhabarkhiz]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[NoghatKhabarkhiz](
        [NoghteKhabarkhizId] BIGINT IDENTITY(1,1) NOT NULL,
        [Onvan] NVARCHAR(300) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_Akhbar_NoghatKhabarkhiz_IsActive] DEFAULT(1),
        [CreateUserId] BIGINT NULL,
        [CreateDateTime] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Akhbar_NoghatKhabarkhiz_CreateDateTime] DEFAULT([dbo].[FarsiDateTimeNow]()),
        [LastEditUserId] BIGINT NULL,
        [LastEditDateTime] NVARCHAR(20) NULL,
        CONSTRAINT [PK_Akhbar_NoghatKhabarkhiz] PRIMARY KEY CLUSTERED ([NoghteKhabarkhizId] ASC)
    );
END
GO

/* ============================================================
   جدول مشخصات خبر
   TabaqehBandi: 1 عادی | 2 محرمانه | 3 خیلی محرمانه
   NoeKhabar:     1 سیاسی | 2 اجتماعی | 3 فرهنگی | 4 اقتصادی
   ============================================================ */
IF OBJECT_ID(N'[Akhbar].[Khabar]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[Khabar](
        [ShomareKhabar] BIGINT IDENTITY(1,1) NOT NULL,
        [TabaqehBandi] TINYINT NOT NULL,
        [ManbaKhabarId] INT NOT NULL,
        [NoeKhabar] TINYINT NOT NULL,
        [TarikhNameh] NCHAR(10) NULL,
        [ShomareNameh] NVARCHAR(100) NULL,
        [OnvanKhabar] NVARCHAR(500) NOT NULL,
        [SharhKhabar] NVARCHAR(MAX) NOT NULL,
        [MolahazatKhabar] NVARCHAR(MAX) NOT NULL,
        [NoghteKhabarkhizId] BIGINT NULL,
        [MahalNoghteKhabarkhiz] NVARCHAR(500) NULL,
        [TarikhEnteshar] NCHAR(10) NULL,

        /* محل و پست ایجاد خبر در زمان ثبت، جهت تثبیت سابقه سازمانی */
        [CreateMahal] INT NOT NULL,
        [CreatePostId] INT NOT NULL,

        [CreateUserId] BIGINT NOT NULL,
        [CreateDateTime] NVARCHAR(20) NOT NULL,
        [LastEditUserId] BIGINT NULL,
        [LastEditDateTime] NVARCHAR(20) NULL,

        [IsDelete] BIT NOT NULL CONSTRAINT [DF_Akhbar_Khabar_IsDelete] DEFAULT(0),
        [DeleteUserId] BIGINT NULL,
        [DeleteDateTime] NVARCHAR(20) NULL,

        CONSTRAINT [PK_Akhbar_Khabar] PRIMARY KEY CLUSTERED ([ShomareKhabar] ASC),
        CONSTRAINT [FK_Akhbar_Khabar_ManabeKhabar] FOREIGN KEY ([ManbaKhabarId])
            REFERENCES [Akhbar].[ManabeKhabar]([ManbaKhabarId]),
        CONSTRAINT [FK_Akhbar_Khabar_NoghatKhabarkhiz] FOREIGN KEY ([NoghteKhabarkhizId])
            REFERENCES [Akhbar].[NoghatKhabarkhiz]([NoghteKhabarkhizId]),
        CONSTRAINT [CK_Akhbar_Khabar_TabaqehBandi] CHECK ([TabaqehBandi] IN (1,2,3)),
        CONSTRAINT [CK_Akhbar_Khabar_NoeKhabar] CHECK ([NoeKhabar] IN (1,2,3,4)),
        CONSTRAINT [CK_Akhbar_Khabar_NoghteOrMahal] CHECK (
            [NoghteKhabarkhizId] IS NOT NULL
            OR NULLIF(LTRIM(RTRIM([MahalNoghteKhabarkhiz])), N'') IS NOT NULL
        )
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Akhbar_Khabar_CreateUser_IsDelete_ShKhabar'
      AND object_id = OBJECT_ID(N'[Akhbar].[Khabar]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Akhbar_Khabar_CreateUser_IsDelete_ShKhabar]
    ON [Akhbar].[Khabar]([CreateUserId], [IsDelete], [ShomareKhabar] DESC)
    INCLUDE ([TabaqehBandi], [ManbaKhabarId], [NoeKhabar], [OnvanKhabar], [TarikhEnteshar], [CreateDateTime]);
END
GO

/* ============================================================
   دراپ‌دان‌ها
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarLookups]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [ManbaKhabarId], [Onvan]
    FROM [Akhbar].[ManabeKhabar]
    WHERE [IsActive] = 1
    ORDER BY [Onvan];

    SELECT [NoghteKhabarkhizId], [Onvan]
    FROM [Akhbar].[NoghatKhabarkhiz]
    WHERE [IsActive] = 1
    ORDER BY [Onvan];
END
GO

/* ============================================================
   INSERT
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

    IF NOT EXISTS (SELECT 1 FROM [Akhbar].[ManabeKhabar] WHERE [ManbaKhabarId]=@ManbaKhabarId AND [IsActive]=1)
        THROW 51000, N'منبع خبر معتبر نیست.', 1;

    IF @NoghteKhabarkhizId IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM [Akhbar].[NoghatKhabarkhiz] WHERE [NoghteKhabarkhizId]=@NoghteKhabarkhizId AND [IsActive]=1)
        THROW 51000, N'نقطه خبرخیز معتبر نیست.', 1;

    IF NULLIF(LTRIM(RTRIM(@OnvanKhabar)), N'') IS NULL
        THROW 51000, N'عنوان خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@SharhKhabar)), N'') IS NULL
        THROW 51000, N'شرح خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@MolahazatKhabar)), N'') IS NULL
        THROW 51000, N'ملاحظات خبر اجباری است.', 1;

    IF @NoghteKhabarkhizId IS NULL AND NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N'') IS NULL
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
   UPDATE
   در این مرحله فقط ایجادکننده خبر اجازه ویرایش مشخصات خبر را دارد.
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

    IF NOT EXISTS (SELECT 1 FROM [Akhbar].[ManabeKhabar] WHERE [ManbaKhabarId]=@ManbaKhabarId AND [IsActive]=1)
        THROW 51000, N'منبع خبر معتبر نیست.', 1;

    IF @NoghteKhabarkhizId IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM [Akhbar].[NoghatKhabarkhiz] WHERE [NoghteKhabarkhizId]=@NoghteKhabarkhizId AND [IsActive]=1)
        THROW 51000, N'نقطه خبرخیز معتبر نیست.', 1;

    IF NULLIF(LTRIM(RTRIM(@OnvanKhabar)), N'') IS NULL
        THROW 51000, N'عنوان خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@SharhKhabar)), N'') IS NULL
        THROW 51000, N'شرح خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@MolahazatKhabar)), N'') IS NULL
        THROW 51000, N'ملاحظات خبر اجباری است.', 1;

    IF @NoghteKhabarkhizId IS NULL AND NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N'') IS NULL
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

/* ============================================================
   DELETE - Soft Delete
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_DeleteKhabar]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [Akhbar].[Khabar]
    SET [IsDelete] = 1,
        [DeleteUserId] = @UserId,
        [DeleteDateTime] = [dbo].[FarsiDateTimeNow]()
    WHERE [ShomareKhabar] = @ShomareKhabar
      AND [CreateUserId] = @UserId
      AND [IsDelete] = 0;

    IF @@ROWCOUNT = 0
        THROW 51000, N'خبر یافت نشد یا اجازه حذف آن را ندارید.', 1;

    SELECT @ShomareKhabar AS [ShomareKhabar];
END
GO

/* ============================================================
   GET BY ID
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarById]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        K.[ShomareKhabar], K.[TabaqehBandi], K.[ManbaKhabarId],
        M.[Onvan] AS [ManbaKhabarName],
        K.[NoeKhabar], K.[TarikhNameh], K.[ShomareNameh],
        K.[OnvanKhabar], K.[SharhKhabar], K.[MolahazatKhabar],
        K.[NoghteKhabarkhizId], N.[Onvan] AS [NoghteKhabarkhizName],
        K.[MahalNoghteKhabarkhiz], K.[TarikhEnteshar],
        K.[CreateMahal], K.[CreatePostId],
        K.[CreateUserId], K.[CreateDateTime], K.[LastEditUserId], K.[LastEditDateTime]
    FROM [Akhbar].[Khabar] K
    INNER JOIN [Akhbar].[ManabeKhabar] M ON M.[ManbaKhabarId] = K.[ManbaKhabarId]
    LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
    WHERE K.[ShomareKhabar] = @ShomareKhabar
      AND K.[CreateUserId] = @UserId
      AND K.[IsDelete] = 0;
END
GO

/* ============================================================
   LIST - SQL PAGINATION
   SortIndex:
      1 شماره خبر
      2 عنوان خبر
      3 طبقه بندی
      4 نوع خبر
      5 تاریخ ایجاد
   SECDEC: 1 ASC | 2 DESC
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPage]
    @UserId BIGINT,
    @Page INT,
    @SizePage INT,
    @SortIndex INT = 1,
    @SECDEC INT = 2,
    @Search NVARCHAR(200) = N''
AS
BEGIN
    SET NOCOUNT ON;

    IF @Page IS NULL OR @Page < 1 SET @Page = 1;
    IF @SizePage IS NULL OR @SizePage < 1 SET @SizePage = 10;
    IF @SizePage > 100 SET @SizePage = 100;
    IF @SortIndex NOT BETWEEN 1 AND 5 SET @SortIndex = 1;
    IF @SECDEC NOT IN (1,2) SET @SECDEC = 2;
    SET @Search = ISNULL(LTRIM(RTRIM(@Search)), N'');

    ;WITH KhabarCTE AS
    (
        SELECT
            K.[ShomareKhabar],
            K.[TabaqehBandi],
            CASE K.[TabaqehBandi]
                WHEN 1 THEN N'عادی'
                WHEN 2 THEN N'محرمانه'
                WHEN 3 THEN N'خیلی محرمانه'
            END AS [TabaqehBandiName],
            K.[ManbaKhabarId],
            M.[Onvan] AS [ManbaKhabarName],
            K.[NoeKhabar],
            CASE K.[NoeKhabar]
                WHEN 1 THEN N'سیاسی'
                WHEN 2 THEN N'اجتماعی'
                WHEN 3 THEN N'فرهنگی'
                WHEN 4 THEN N'اقتصادی'
            END AS [NoeKhabarName],
            K.[TarikhNameh], K.[ShomareNameh], K.[OnvanKhabar],
            K.[NoghteKhabarkhizId], N.[Onvan] AS [NoghteKhabarkhizName],
            K.[MahalNoghteKhabarkhiz], K.[TarikhEnteshar],
            K.[CreateDateTime], K.[LastEditDateTime]
        FROM [Akhbar].[Khabar] K
        INNER JOIN [Akhbar].[ManabeKhabar] M ON M.[ManbaKhabarId] = K.[ManbaKhabarId]
        LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
        WHERE K.[CreateUserId] = @UserId
          AND K.[IsDelete] = 0
          AND
          (
              @Search = N''
              OR K.[OnvanKhabar] LIKE N'%' + @Search + N'%'
              OR K.[ShomareNameh] LIKE N'%' + @Search + N'%'
              OR M.[Onvan] LIKE N'%' + @Search + N'%'
              OR CAST(K.[ShomareKhabar] AS NVARCHAR(30)) LIKE N'%' + @Search + N'%'
          )
    )
    SELECT
        ROW_NUMBER() OVER (
            ORDER BY
                CASE WHEN @SortIndex=1 AND @SECDEC=1 THEN [ShomareKhabar] END ASC,
                CASE WHEN @SortIndex=1 AND @SECDEC=2 THEN [ShomareKhabar] END DESC,
                CASE WHEN @SortIndex=2 AND @SECDEC=1 THEN [OnvanKhabar] END ASC,
                CASE WHEN @SortIndex=2 AND @SECDEC=2 THEN [OnvanKhabar] END DESC,
                CASE WHEN @SortIndex=3 AND @SECDEC=1 THEN [TabaqehBandi] END ASC,
                CASE WHEN @SortIndex=3 AND @SECDEC=2 THEN [TabaqehBandi] END DESC,
                CASE WHEN @SortIndex=4 AND @SECDEC=1 THEN [NoeKhabar] END ASC,
                CASE WHEN @SortIndex=4 AND @SECDEC=2 THEN [NoeKhabar] END DESC,
                CASE WHEN @SortIndex=5 AND @SECDEC=1 THEN [CreateDateTime] END ASC,
                CASE WHEN @SortIndex=5 AND @SECDEC=2 THEN [CreateDateTime] END DESC,
                [ShomareKhabar] DESC
        ) AS [Rdf],
        *,
        (SELECT COUNT(*) FROM KhabarCTE) AS [TotalCount]
    FROM KhabarCTE
    ORDER BY
        CASE WHEN @SortIndex=1 AND @SECDEC=1 THEN [ShomareKhabar] END ASC,
        CASE WHEN @SortIndex=1 AND @SECDEC=2 THEN [ShomareKhabar] END DESC,
        CASE WHEN @SortIndex=2 AND @SECDEC=1 THEN [OnvanKhabar] END ASC,
        CASE WHEN @SortIndex=2 AND @SECDEC=2 THEN [OnvanKhabar] END DESC,
        CASE WHEN @SortIndex=3 AND @SECDEC=1 THEN [TabaqehBandi] END ASC,
        CASE WHEN @SortIndex=3 AND @SECDEC=2 THEN [TabaqehBandi] END DESC,
        CASE WHEN @SortIndex=4 AND @SECDEC=1 THEN [NoeKhabar] END ASC,
        CASE WHEN @SortIndex=4 AND @SECDEC=2 THEN [NoeKhabar] END DESC,
        CASE WHEN @SortIndex=5 AND @SECDEC=1 THEN [CreateDateTime] END ASC,
        CASE WHEN @SortIndex=5 AND @SECDEC=2 THEN [CreateDateTime] END DESC,
        [ShomareKhabar] DESC
    OFFSET (@Page - 1) * @SizePage ROWS
    FETCH NEXT @SizePage ROWS ONLY;
END
GO
