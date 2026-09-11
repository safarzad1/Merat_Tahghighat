USE [MeratDB]
GO

/* ============================================================
   مرحله 3 اخبار
   منبع خبر از dbo.DFN با PID = 10201 خوانده می‌شود.
   مقدار ذخیره‌شده در Akhbar.Khabar.ManbaKhabarId = DFN.ID
   ============================================================ */

/* FK قدیمی به جدول مستقل منبع خبر دیگر نباید وجود داشته باشد. */
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE [name] = N'FK_Akhbar_Khabar_ManabeKhabar'
      AND [parent_object_id] = OBJECT_ID(N'[Akhbar].[Khabar]')
)
BEGIN
    ALTER TABLE [Akhbar].[Khabar]
    DROP CONSTRAINT [FK_Akhbar_Khabar_ManabeKhabar];
END
GO

/* Lookupها: خروجی اول برای سازگاری API = منابع خبر از DFN، خروجی دوم نقاط خبرخیز محل کاربر */
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

    SELECT
        [ID] AS [ManbaKhabarId],
        [NameFarsi] AS [Onvan]
    FROM [dbo].[DFN]
    WHERE [PID] = 10201
    ORDER BY [NameFarsi];

    SELECT [NoghteKhabarkhizId], [Mahal], [Onvan]
    FROM [Akhbar].[NoghatKhabarkhiz]
    WHERE [IsActive] = 1
      AND [Mahal] = @Mahal
    ORDER BY [Onvan];
END
GO

/* INSERT خبر */
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
        SELECT 1
        FROM [dbo].[DFN]
        WHERE [ID] = @ManbaKhabarId
          AND [PID] = 10201
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

/* UPDATE خبر */
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
        SELECT 1
        FROM [dbo].[DFN]
        WHERE [ID] = @ManbaKhabarId
          AND [PID] = 10201
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

/* GET BY ID */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarById]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        K.[ShomareKhabar], K.[TabaqehBandi], K.[ManbaKhabarId],
        M.[NameFarsi] AS [ManbaKhabarName],
        K.[NoeKhabar], K.[TarikhNameh], K.[ShomareNameh],
        K.[OnvanKhabar], K.[SharhKhabar], K.[MolahazatKhabar],
        K.[NoghteKhabarkhizId], N.[Onvan] AS [NoghteKhabarkhizName],
        K.[MahalNoghteKhabarkhiz], K.[TarikhEnteshar],
        K.[CreateMahal], K.[CreatePostId],
        K.[CreateUserId], K.[CreateDateTime], K.[LastEditUserId], K.[LastEditDateTime]
    FROM [Akhbar].[Khabar] K
    INNER JOIN [dbo].[DFN] M
        ON M.[ID] = K.[ManbaKhabarId]
       AND M.[PID] = 10201
    LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N
        ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
    WHERE K.[ShomareKhabar] = @ShomareKhabar
      AND K.[CreateUserId] = @UserId
      AND K.[IsDelete] = 0;
END
GO

/* LIST با صفحه‌بندی SQL */
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
            M.[NameFarsi] AS [ManbaKhabarName],
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
        INNER JOIN [dbo].[DFN] M
            ON M.[ID] = K.[ManbaKhabarId]
           AND M.[PID] = 10201
        LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N
            ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
        WHERE K.[CreateUserId] = @UserId
          AND K.[IsDelete] = 0
          AND
          (
              @Search = N''
              OR K.[OnvanKhabar] LIKE N'%' + @Search + N'%'
              OR K.[ShomareNameh] LIKE N'%' + @Search + N'%'
              OR M.[NameFarsi] LIKE N'%' + @Search + N'%'
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
