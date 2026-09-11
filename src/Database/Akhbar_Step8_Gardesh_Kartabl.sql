USE [MeratDB]
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Akhbar')
    EXEC(N'CREATE SCHEMA [Akhbar] AUTHORIZATION [dbo]');
GO

/* ============================================================
   کارتابل جاری خبر: برای هر خبر فقط مقصد فعلی نگهداری می‌شود.
   ============================================================ */
IF OBJECT_ID(N'[Akhbar].[KhabarKartabl]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[KhabarKartabl](
        [KartablId] BIGINT IDENTITY(1,1) NOT NULL,
        [ShomareKhabar] BIGINT NOT NULL,
        [CurrentUserId] BIGINT NOT NULL,
        [CurrentPostId] BIGINT NOT NULL,
        [CurrentMahal] BIGINT NOT NULL,
        [FromUserId] BIGINT NOT NULL,
        [FromPostId] BIGINT NOT NULL,
        [FromMahal] BIGINT NOT NULL,
        [ErsalDateTime] NVARCHAR(20) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_Akhbar_KhabarKartabl_IsActive] DEFAULT(1),
        CONSTRAINT [PK_Akhbar_KhabarKartabl] PRIMARY KEY CLUSTERED ([KartablId] ASC),
        CONSTRAINT [FK_Akhbar_KhabarKartabl_Khabar] FOREIGN KEY ([ShomareKhabar])
            REFERENCES [Akhbar].[Khabar]([ShomareKhabar])
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE [name] = N'UX_Akhbar_KhabarKartabl_ActiveNews'
      AND [object_id] = OBJECT_ID(N'[Akhbar].[KhabarKartabl]')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_Akhbar_KhabarKartabl_ActiveNews]
    ON [Akhbar].[KhabarKartabl]([ShomareKhabar])
    WHERE [IsActive] = 1;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE [name] = N'IX_Akhbar_KhabarKartabl_CurrentUser'
      AND [object_id] = OBJECT_ID(N'[Akhbar].[KhabarKartabl]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Akhbar_KhabarKartabl_CurrentUser]
    ON [Akhbar].[KhabarKartabl]([CurrentUserId], [IsActive], [ShomareKhabar] DESC)
    INCLUDE ([CurrentPostId], [CurrentMahal], [FromUserId], [ErsalDateTime]);
END
GO

/* ============================================================
   لاگ گردش خبر: تاریخچه هر ارسال نگهداری می‌شود.
   ============================================================ */
IF OBJECT_ID(N'[Akhbar].[KhabarGardeshLog]', N'U') IS NULL
BEGIN
    CREATE TABLE [Akhbar].[KhabarGardeshLog](
        [LogId] BIGINT IDENTITY(1,1) NOT NULL,
        [ShomareKhabar] BIGINT NOT NULL,
        [FromUserId] BIGINT NOT NULL,
        [FromPostId] BIGINT NOT NULL,
        [FromMahal] BIGINT NOT NULL,
        [ToUserId] BIGINT NOT NULL,
        [ToPostId] BIGINT NOT NULL,
        [ToMahal] BIGINT NOT NULL,
        [NoeEghdam] NVARCHAR(50) NOT NULL,
        [Tozihat] NVARCHAR(1000) NULL,
        [CreateUserId] BIGINT NOT NULL,
        [CreateDateTime] NVARCHAR(20) NOT NULL,
        CONSTRAINT [PK_Akhbar_KhabarGardeshLog] PRIMARY KEY CLUSTERED ([LogId] ASC),
        CONSTRAINT [FK_Akhbar_KhabarGardeshLog_Khabar] FOREIGN KEY ([ShomareKhabar])
            REFERENCES [Akhbar].[Khabar]([ShomareKhabar])
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE [name] = N'IX_Akhbar_KhabarGardeshLog_News'
      AND [object_id] = OBJECT_ID(N'[Akhbar].[KhabarGardeshLog]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Akhbar_KhabarGardeshLog_News]
    ON [Akhbar].[KhabarGardeshLog]([ShomareKhabar], [LogId] DESC);
END
GO

/* ============================================================
   ارسال/ارجاع خبر به اولین کاربر فعال بالادست.

   مسیرهای فعلی برای تست:
   70 نماینده شهرستان -> 61 مسئول اسناد و تحقیق حوزه -> 60 رئیس حوزه
   60 رئیس حوزه -> استان: 53 -> 52 -> 51 -> 50

   اگر یک پست کاربر فعال نداشته باشد، از آن عبور می‌شود.
   همین Procedure برای ارسال اولیه و ارسال مرحله بعد استفاده می‌شود.
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_SendKhabar]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @FromMahal BIGINT,
        @FromPostId BIGINT,
        @CreateUserId BIGINT,
        @CurrentUserId BIGINT,
        @HozeMahal BIGINT,
        @OstanMahal BIGINT,
        @ToUserId BIGINT,
        @ToPostId BIGINT,
        @ToMahal BIGINT,
        @ToFullName NVARCHAR(500),
        @ToOnvanPost NVARCHAR(500),
        @ToNameMahal NVARCHAR(1000);

    SELECT
        @FromMahal = U.[Mahal],
        @FromPostId = U.[PostId]
    FROM [dbo].[Users] U
    WHERE U.[UserId] = @UserId
      AND U.[IsActive] = 1;

    IF @FromMahal IS NULL OR @FromPostId IS NULL
        THROW 51000, N'کاربر فعال برای ارسال خبر یافت نشد.', 1;

    SELECT @CreateUserId = K.[CreateUserId]
    FROM [Akhbar].[Khabar] K
    WHERE K.[ShomareKhabar] = @ShomareKhabar
      AND K.[IsDelete] = 0;

    IF @CreateUserId IS NULL
        THROW 51000, N'خبر مورد نظر یافت نشد.', 1;

    SELECT @CurrentUserId = KT.[CurrentUserId]
    FROM [Akhbar].[KhabarKartabl] KT
    WHERE KT.[ShomareKhabar] = @ShomareKhabar
      AND KT.[IsActive] = 1;

    /* ارسال اولیه فقط توسط ایجادکننده؛ مراحل بعد فقط توسط صاحب فعلی کارتابل */
    IF @CurrentUserId IS NULL
    BEGIN
        IF @CreateUserId <> @UserId
            THROW 51000, N'اجازه ارسال این خبر را ندارید.', 1;
    END
    ELSE IF @CurrentUserId <> @UserId
        THROW 51000, N'این خبر در کارتابل شما قرار ندارد.', 1;

    DECLARE @Candidates TABLE
    (
        [Priority] INT NOT NULL,
        [PostId] BIGINT NOT NULL,
        [Mahal] BIGINT NOT NULL
    );

    /* تشخیص حوزه و استان برای پست‌های شهرستان/حوزه */
    IF @FromPostId IN (70,61,60)
    BEGIN
        SELECT
            @HozeMahal = CASE WHEN ISNULL(C.[IsHoze],0)=1 THEN C.[CityId] ELSE C.[CityIdHozeh] END
        FROM [dbo].[Citys] C
        WHERE C.[CityId] = @FromMahal;

        IF @HozeMahal IS NULL
            THROW 51000, N'حوزه انتخابیه بالادست برای محل کاربر مشخص نشد.', 1;

        SELECT @OstanMahal = C.[PCityId]
        FROM [dbo].[Citys] C
        WHERE C.[CityId] = @HozeMahal;

        IF @OstanMahal IS NULL
            THROW 51000, N'استان بالادست حوزه انتخابیه مشخص نشد.', 1;
    END

    /* نماینده شهرستان: ابتدا مسئول تحقیقات حوزه، سپس رئیس حوزه، بعد استان */
    IF @FromPostId = 70
    BEGIN
        INSERT INTO @Candidates VALUES
            (10,61,@HozeMahal),
            (20,60,@HozeMahal),
            (30,53,@OstanMahal),
            (40,52,@OstanMahal),
            (50,51,@OstanMahal),
            (60,50,@OstanMahal);
    END
    /* مسئول اسناد و تحقیق حوزه: رئیس حوزه، سپس استان */
    ELSE IF @FromPostId = 61
    BEGIN
        INSERT INTO @Candidates VALUES
            (10,60,@HozeMahal),
            (20,53,@OstanMahal),
            (30,52,@OstanMahal),
            (40,51,@OstanMahal),
            (50,50,@OstanMahal);
    END
    /* رئیس حوزه: اولین کاربر فعال استان */
    ELSE IF @FromPostId = 60
    BEGIN
        INSERT INTO @Candidates VALUES
            (10,53,@OstanMahal),
            (20,52,@OstanMahal),
            (30,51,@OstanMahal),
            (40,50,@OstanMahal);
    END
    /* مسیر استان برای تست‌های بعدی نیز از همین حالا پیش‌بینی شده است. */
    ELSE IF @FromPostId = 53
    BEGIN
        INSERT INTO @Candidates VALUES
            (10,52,@FromMahal),
            (20,51,@FromMahal),
            (30,50,@FromMahal);
    END
    ELSE IF @FromPostId = 52
    BEGIN
        INSERT INTO @Candidates VALUES
            (10,51,@FromMahal),
            (20,50,@FromMahal);
    END
    ELSE IF @FromPostId = 51
    BEGIN
        INSERT INTO @Candidates VALUES
            (10,50,@FromMahal);
    END
    ELSE IF @FromPostId = 50
    BEGIN
        THROW 51000, N'مسیر بعد از رئیس دفتر استان در مرحله بعد تعریف می‌شود.', 1;
    END
    ELSE
        THROW 51000, N'مسیر گردش برای سمت فعلی هنوز تعریف نشده است.', 1;

    SELECT TOP (1)
        @ToUserId = U.[UserId],
        @ToPostId = C.[PostId],
        @ToMahal = C.[Mahal]
    FROM @Candidates C
    INNER JOIN [dbo].[Users] U
        ON U.[PostId] = C.[PostId]
       AND U.[Mahal] = C.[Mahal]
       AND U.[IsActive] = 1
    ORDER BY C.[Priority], U.[UserId];

    IF @ToUserId IS NULL
        THROW 51000, N'در مسیر بالادست، کاربر فعالی برای دریافت خبر پیدا نشد.', 1;

    SELECT TOP (1)
        @ToFullName = ISNULL(V.[FullName], N''),
        @ToOnvanPost = ISNULL(V.[OnvanPost], N''),
        @ToNameMahal = ISNULL(V.[NameMahal], N'')
    FROM [dbo].[Vbl_Users] V
    WHERE V.[UserId] = @ToUserId;

    BEGIN TRAN;

    UPDATE [Akhbar].[KhabarKartabl]
    SET [IsActive] = 0
    WHERE [ShomareKhabar] = @ShomareKhabar
      AND [IsActive] = 1;

    INSERT INTO [Akhbar].[KhabarKartabl]
    (
        [ShomareKhabar], [CurrentUserId], [CurrentPostId], [CurrentMahal],
        [FromUserId], [FromPostId], [FromMahal], [ErsalDateTime], [IsActive]
    )
    VALUES
    (
        @ShomareKhabar, @ToUserId, @ToPostId, @ToMahal,
        @UserId, @FromPostId, @FromMahal, [dbo].[FarsiDateTimeNow](), 1
    );

    INSERT INTO [Akhbar].[KhabarGardeshLog]
    (
        [ShomareKhabar], [FromUserId], [FromPostId], [FromMahal],
        [ToUserId], [ToPostId], [ToMahal], [NoeEghdam], [Tozihat],
        [CreateUserId], [CreateDateTime]
    )
    VALUES
    (
        @ShomareKhabar, @UserId, @FromPostId, @FromMahal,
        @ToUserId, @ToPostId, @ToMahal, N'ارسال خبر', NULL,
        @UserId, [dbo].[FarsiDateTimeNow]()
    );

    COMMIT;

    SELECT
        @ShomareKhabar AS [ShomareKhabar],
        @ToUserId AS [ToUserId],
        @ToPostId AS [ToPostId],
        @ToMahal AS [ToMahal],
        @ToFullName AS [ToFullName],
        @ToOnvanPost AS [ToOnvanPost],
        @ToNameMahal AS [ToNameMahal],
        N'ارسال شد' AS [StateName];
END
GO

/* ============================================================
   فهرست: خبرهای ایجادشده توسط کاربر + خبرهای موجود در کارتابل او
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
            TB.[NameFarsi] AS [TabaqehBandiName],
            K.[ManbaKhabarId],
            M.[NameFarsi] AS [ManbaKhabarName],
            K.[NoeKhabar],
            NK.[NameFarsi] AS [NoeKhabarName],
            K.[TarikhNameh], K.[ShomareNameh], K.[OnvanKhabar],
            K.[NoghteKhabarkhizId], N.[Onvan] AS [NoghteKhabarkhizName],
            K.[MahalNoghteKhabarkhiz], K.[TarikhEnteshar],
            K.[CreateDateTime], K.[LastEditDateTime],
            CAST(CASE WHEN K.[CreateUserId] = @UserId THEN 1 ELSE 0 END AS BIT) AS [IsOwner],
            CAST(CASE WHEN KT.[CurrentUserId] = @UserId THEN 1 ELSE 0 END AS BIT) AS [IsInbox],
            CASE
                WHEN KT.[KartablId] IS NULL THEN N'پیش‌نویس'
                WHEN KT.[CurrentUserId] = @UserId AND K.[CreateUserId] <> @UserId THEN N'دریافتی'
                WHEN KT.[CurrentUserId] = @UserId THEN N'در کارتابل من'
                ELSE N'ارسال شده'
            END AS [GardeshVaziat],
            KT.[CurrentUserId], KT.[CurrentPostId], KT.[CurrentMahal],
            P.[OnvanPost] AS [CurrentPostName],
            ISNULL(V.[FullName], N'') AS [CurrentUserName]
        FROM [Akhbar].[Khabar] K
        INNER JOIN [dbo].[DFN] M
            ON M.[ID] = K.[ManbaKhabarId] AND M.[PID] = 10201
        LEFT JOIN [dbo].[DFN] TB
            ON TB.[ID] = K.[TabaqehBandi] AND TB.[PID] = 71101
        LEFT JOIN [dbo].[DFN] NK
            ON NK.[ID] = K.[NoeKhabar] AND NK.[PID] = 71102
        LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N
            ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
        LEFT JOIN [Akhbar].[KhabarKartabl] KT
            ON KT.[ShomareKhabar] = K.[ShomareKhabar]
           AND KT.[IsActive] = 1
        LEFT JOIN [dbo].[Posts] P
            ON P.[PostId] = KT.[CurrentPostId]
        LEFT JOIN [dbo].[Vbl_Users] V
            ON V.[UserId] = KT.[CurrentUserId]
        WHERE K.[IsDelete] = 0
          AND (K.[CreateUserId] = @UserId OR KT.[CurrentUserId] = @UserId)
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

/* ============================================================
   مشاهده خبر: ایجادکننده یا کاربر فعلی کارتابل
   ============================================================ */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarById]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        K.[ShomareKhabar],
        K.[TabaqehBandi], TB.[NameFarsi] AS [TabaqehBandiName],
        K.[ManbaKhabarId], M.[NameFarsi] AS [ManbaKhabarName],
        K.[NoeKhabar], NK.[NameFarsi] AS [NoeKhabarName],
        K.[TarikhNameh], K.[ShomareNameh],
        K.[OnvanKhabar], K.[SharhKhabar], K.[MolahazatKhabar],
        K.[NoghteKhabarkhizId], N.[Onvan] AS [NoghteKhabarkhizName],
        K.[MahalNoghteKhabarkhiz], K.[TarikhEnteshar],
        K.[CreateMahal], K.[CreatePostId],
        K.[CreateUserId], K.[CreateDateTime], K.[LastEditUserId], K.[LastEditDateTime],
        CAST(CASE WHEN K.[CreateUserId] = @UserId THEN 1 ELSE 0 END AS BIT) AS [IsOwner],
        CAST(CASE WHEN KT.[CurrentUserId] = @UserId THEN 1 ELSE 0 END AS BIT) AS [IsInbox],
        KT.[CurrentUserId], KT.[CurrentPostId], KT.[CurrentMahal],
        P.[OnvanPost] AS [CurrentPostName],
        ISNULL(V.[FullName], N'') AS [CurrentUserName]
    FROM [Akhbar].[Khabar] K
    LEFT JOIN [dbo].[DFN] TB
        ON TB.[ID] = K.[TabaqehBandi] AND TB.[PID] = 71101
    INNER JOIN [dbo].[DFN] M
        ON M.[ID] = K.[ManbaKhabarId] AND M.[PID] = 10201
    LEFT JOIN [dbo].[DFN] NK
        ON NK.[ID] = K.[NoeKhabar] AND NK.[PID] = 71102
    LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N
        ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
    LEFT JOIN [Akhbar].[KhabarKartabl] KT
        ON KT.[ShomareKhabar] = K.[ShomareKhabar]
       AND KT.[IsActive] = 1
    LEFT JOIN [dbo].[Posts] P
        ON P.[PostId] = KT.[CurrentPostId]
    LEFT JOIN [dbo].[Vbl_Users] V
        ON V.[UserId] = KT.[CurrentUserId]
    WHERE K.[ShomareKhabar] = @ShomareKhabar
      AND K.[IsDelete] = 0
      AND (K.[CreateUserId] = @UserId OR KT.[CurrentUserId] = @UserId);
END
GO

/* اشخاص وابسته برای ایجادکننده یا صاحب فعلی کارتابل قابل مشاهده‌اند. */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarAshkhas]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        LEFT JOIN [Akhbar].[KhabarKartabl] KT
            ON KT.[ShomareKhabar] = K.[ShomareKhabar] AND KT.[IsActive] = 1
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND (K.[CreateUserId] = @UserId OR KT.[CurrentUserId] = @UserId)
    )
        THROW 51000, N'خبر یافت نشد یا دسترسی مجاز نیست.', 1;

    SELECT
        KA.[KhabarShakhsId],
        KA.[ShomarehParvandeh],
        A.[FirstName], A.[LastName], A.[NamePedar],
        KA.[CreateDateTime]
    FROM [Akhbar].[KhabarAshkhas] KA
    INNER JOIN [Davtalab].[Ashkhas] A
        ON A.[ShomarehParvandeh] = KA.[ShomarehParvandeh]
    WHERE KA.[ShomareKhabar] = @ShomareKhabar
      AND KA.[IsDelete] = 0
    ORDER BY KA.[KhabarShakhsId] DESC;
END
GO

/* پیوست‌ها: ایجادکننده یا صاحب فعلی کارتابل */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPeyvastha]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        LEFT JOIN [Akhbar].[KhabarKartabl] KT
            ON KT.[ShomareKhabar] = K.[ShomareKhabar] AND KT.[IsActive] = 1
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND (K.[CreateUserId] = @UserId OR KT.[CurrentUserId] = @UserId)
    )
        THROW 51000, N'خبر یافت نشد یا دسترسی مجاز نیست.', 1;

    SELECT
        KP.[KhabarPeyvastId],
        KP.[ShomareKhabar],
        KP.[FileName],
        KP.[OriginalFileName],
        ISNULL(PF.[FileSize], 0) AS [FileSize],
        ISNULL(PF.[CreateDateTime], KP.[CreateDateTime]) AS [CreateDateTime]
    FROM [Akhbar].[KhabarPeyvast] KP
    LEFT JOIN [MeratFilesDB].[dbo].[PeyvastFiles] PF
        ON PF.[FileName] = KP.[FileName]
    WHERE KP.[ShomareKhabar] = @ShomareKhabar
    ORDER BY KP.[KhabarPeyvastId] ASC;
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPeyvastFile]
    @ShomareKhabar BIGINT,
    @FileName NVARCHAR(250),
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        LEFT JOIN [Akhbar].[KhabarKartabl] KT
            ON KT.[ShomareKhabar] = K.[ShomareKhabar] AND KT.[IsActive] = 1
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND (K.[CreateUserId] = @UserId OR KT.[CurrentUserId] = @UserId)
    )
        THROW 51000, N'خبر یافت نشد یا دسترسی مجاز نیست.', 1;

    SELECT TOP (1)
        PF.[FileName], PF.[Files], PF.[FileSize]
    FROM [Akhbar].[KhabarPeyvast] KP
    INNER JOIN [MeratFilesDB].[dbo].[PeyvastFiles] PF
        ON PF.[FileName] = KP.[FileName]
    WHERE KP.[ShomareKhabar] = @ShomareKhabar
      AND KP.[FileName] = @FileName;
END
GO
