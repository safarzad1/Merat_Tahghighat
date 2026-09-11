USE [MeratDB];
GO

/* ============================================================
   مرحله 16 اخبار - داشبورد سلسله مراتبی
   - ستاد: کل کشور
   - استان: استان و شهرستان های زیرمجموعه
   - حوزه: مرکز حوزه و شهرستان های تابع آن حوزه
   - شهرستان: همان شهرستان
   نکته: پیش نویس کاربران پایین دست در آمار بالادست دیده نمی شود.
   ============================================================ */

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_Akhbar_Khabar_Dashboard'
      AND [object_id] = OBJECT_ID(N'[Akhbar].[Khabar]')
)
BEGIN
    CREATE INDEX [IX_Akhbar_Khabar_Dashboard]
    ON [Akhbar].[Khabar]([CreateMahal],[CreateDateTime])
    INCLUDE([ShomareKhabar],[CurrentStatusCode],[CreateUserId],[OnvanKhabar],[TabaqehBandi])
    WHERE [IsDelete] = 0;
END
GO

CREATE OR ALTER PROCEDURE [Dashboard].[SP_AkhbarDashboard]
    @UserId BIGINT,
    @Today NCHAR(10),
    @Yesterday NCHAR(10),
    @WeekStart NCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @PostId BIGINT,
        @Mahal BIGINT,
        @RollId INT,
        @AccessLevel NVARCHAR(20),
        @ScopeTitle NVARCHAR(500) = N'';

    SELECT
        @PostId = U.[PostId],
        @Mahal = U.[Mahal],
        @RollId = P.[RollId]
    FROM [dbo].[Users] U
    INNER JOIN [dbo].[Posts] P ON P.[PostId] = U.[PostId]
    WHERE U.[UserId] = @UserId
      AND U.[IsActive] = 1;

    IF @PostId IS NULL
        THROW 51000, N'کاربر فعال یافت نشد.', 1;

    SET @AccessLevel =
        CASE
            WHEN @RollId = 1 OR @Mahal = 1 THEN N'SETAD'
            WHEN @RollId IN (2,5) OR LEN(CONVERT(VARCHAR(20), @Mahal)) = 3 THEN N'OSTAN'
            WHEN @PostId IN (60,61) THEN N'HOZE'
            ELSE N'SHAHR'
        END;

    DECLARE @Scope TABLE
    (
        [Mahal] BIGINT NOT NULL PRIMARY KEY,
        [GroupMahal] BIGINT NOT NULL,
        [GroupName] NVARCHAR(500) NOT NULL,
        [MahalName] NVARCHAR(500) NOT NULL
    );

    IF @AccessLevel = N'SETAD'
    BEGIN
        SET @ScopeTitle = N'کل کشور';

        INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
        VALUES(1,1,N'ستاد',N'ستاد');

        INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
        SELECT
            C.[CityId],
            CASE
                WHEN LEN(CONVERT(VARCHAR(20), C.[CityId])) = 3 THEN C.[CityId]
                ELSE ISNULL(C.[PCityId], C.[CityId])
            END,
            CASE
                WHEN LEN(CONVERT(VARCHAR(20), C.[CityId])) = 3 THEN ISNULL(C.[Name], C.[FullName])
                ELSE ISNULL(P.[Name], ISNULL(C.[Name], C.[FullName]))
            END,
            ISNULL(C.[Name], C.[FullName])
        FROM [dbo].[Citys] C
        LEFT JOIN [dbo].[Citys] P ON P.[CityId] = C.[PCityId]
        WHERE C.[IsActive] = 1
          AND C.[CityId] <> 1
          AND NOT EXISTS (SELECT 1 FROM @Scope S WHERE S.[Mahal] = C.[CityId]);
    END
    ELSE IF @AccessLevel = N'OSTAN'
    BEGIN
        DECLARE @OstanName NVARCHAR(300) =
            (SELECT TOP(1) ISNULL([Name],[FullName]) FROM [dbo].[Citys] WHERE [CityId]=@Mahal);

        SET @ScopeTitle = N'استان ' + ISNULL(@OstanName, CONVERT(NVARCHAR(30),@Mahal));

        INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
        VALUES(@Mahal,@Mahal,N'دفتر استان ' + ISNULL(@OstanName,N''),N'دفتر استان ' + ISNULL(@OstanName,N''));

        INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
        SELECT C.[CityId],C.[CityId],ISNULL(C.[Name],C.[FullName]),ISNULL(C.[Name],C.[FullName])
        FROM [dbo].[Citys] C
        WHERE C.[PCityId]=@Mahal
          AND C.[IsActive]=1
          AND NOT EXISTS (SELECT 1 FROM @Scope S WHERE S.[Mahal]=C.[CityId]);
    END
    ELSE IF @AccessLevel = N'HOZE'
    BEGIN
        DECLARE @HozeName NVARCHAR(500) =
            (SELECT TOP(1) [NameHozeh] FROM [Entekhabat].[Hozeh] WHERE [MarkazHozeh]=@Mahal);

        SET @ScopeTitle = N'حوزه ' + ISNULL(@HozeName,
            ISNULL((SELECT TOP(1) [Name] FROM [dbo].[Citys] WHERE [CityId]=@Mahal),CONVERT(NVARCHAR(30),@Mahal)));

        INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
        SELECT C.[CityId],C.[CityId],ISNULL(C.[Name],C.[FullName]),ISNULL(C.[Name],C.[FullName])
        FROM [dbo].[Citys] C
        WHERE C.[IsActive]=1
          AND (C.[CityId]=@Mahal OR C.[CityIdHozeh]=@Mahal);

        IF NOT EXISTS (SELECT 1 FROM @Scope WHERE [Mahal]=@Mahal)
            INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
            VALUES(@Mahal,@Mahal,ISNULL(@HozeName,N'حوزه انتخابیه'),ISNULL(@HozeName,N'حوزه انتخابیه'));
    END
    ELSE
    BEGIN
        DECLARE @ShahrName NVARCHAR(300) =
            (SELECT TOP(1) ISNULL([Name],[FullName]) FROM [dbo].[Citys] WHERE [CityId]=@Mahal);

        SET @ScopeTitle = ISNULL(@ShahrName,CONVERT(NVARCHAR(30),@Mahal));
        INSERT INTO @Scope([Mahal],[GroupMahal],[GroupName],[MahalName])
        VALUES(@Mahal,@Mahal,ISNULL(@ShahrName,N'شهرستان'),ISNULL(@ShahrName,N'شهرستان'));
    END;

    /* خبرهای قابل مشاهده آماری. پیش نویس پایین دست نمایش داده نمی شود. */
    SELECT K.[ShomareKhabar]
    INTO #ScopedIds
    FROM [Akhbar].[Khabar] K
    INNER JOIN @Scope S ON S.[Mahal]=K.[CreateMahal]
    WHERE K.[IsDelete]=0
      AND
      (
          ISNULL(K.[CurrentStatusCode],N'PISHNEVIS') <> N'PISHNEVIS'
          OR K.[CreateUserId]=@UserId
      );

    CREATE UNIQUE CLUSTERED INDEX IX_ScopedIds ON #ScopedIds([ShomareKhabar]);

    /* 1) کارت های آماری */
    SELECT
        @ScopeTitle AS [ScopeTitle],
        @AccessLevel AS [AccessLevel],
        COUNT_BIG(1) AS [TotalCount],
        SUM(CASE WHEN LEFT(K.[CreateDateTime],10)=@Today THEN 1 ELSE 0 END) AS [TodayCount],
        SUM(CASE WHEN LEFT(K.[CreateDateTime],10)=@Yesterday THEN 1 ELSE 0 END) AS [YesterdayCount],
        SUM(CASE WHEN LEFT(K.[CreateDateTime],10)>=@WeekStart AND LEFT(K.[CreateDateTime],10)<=@Today THEN 1 ELSE 0 END) AS [WeekCount],
        SUM(CASE WHEN K.[CurrentStatusCode] LIKE N'BARGASHT_%' THEN 1 ELSE 0 END) AS [ReturnedCount]
    FROM #ScopedIds X
    INNER JOIN [Akhbar].[Khabar] K ON K.[ShomareKhabar]=X.[ShomareKhabar];

    /* 2) جدول آمار به تفکیک محدوده */
    SELECT
        S.[GroupMahal] AS [Mahal],
        S.[GroupName] AS [MahalName],
        COUNT_BIG(1) AS [TotalCount],
        SUM(CASE WHEN LEFT(K.[CreateDateTime],10)=@Today THEN 1 ELSE 0 END) AS [TodayCount],
        SUM(CASE WHEN LEFT(K.[CreateDateTime],10)=@Yesterday THEN 1 ELSE 0 END) AS [YesterdayCount],
        SUM(CASE WHEN LEFT(K.[CreateDateTime],10)>=@WeekStart AND LEFT(K.[CreateDateTime],10)<=@Today THEN 1 ELSE 0 END) AS [WeekCount]
    FROM #ScopedIds X
    INNER JOIN [Akhbar].[Khabar] K ON K.[ShomareKhabar]=X.[ShomareKhabar]
    INNER JOIN @Scope S ON S.[Mahal]=K.[CreateMahal]
    GROUP BY S.[GroupMahal],S.[GroupName]
    ORDER BY [WeekCount] DESC,[TotalCount] DESC,S.[GroupName];

    /* 3) نمودار روند هفته جاری */
    SELECT
        LEFT(K.[CreateDateTime],10) AS [Tarikh],
        COUNT_BIG(1) AS [CountKhabar]
    FROM #ScopedIds X
    INNER JOIN [Akhbar].[Khabar] K ON K.[ShomareKhabar]=X.[ShomareKhabar]
    WHERE LEFT(K.[CreateDateTime],10)>=@WeekStart
      AND LEFT(K.[CreateDateTime],10)<=@Today
    GROUP BY LEFT(K.[CreateDateTime],10)
    ORDER BY [Tarikh];

    /* 4 تا 6) فهرست های امروز، دیروز و این هفته */
    SELECT
        K.[ShomareKhabar],K.[OnvanKhabar],K.[CreateDateTime],LEFT(K.[CreateDateTime],10) AS [CreateDate],
        K.[CreateMahal],K.[CurrentStatusCode],
        ISNULL(C.[Name],CASE WHEN K.[CreateMahal]=1 THEN N'ستاد' ELSE CONVERT(NVARCHAR(30),K.[CreateMahal]) END) AS [MahalName],
        ISNULL(V.[FullName],N'') AS [CreateUserName],
        ISNULL(TB.[NameFarsi],N'') AS [TabaqehBandiName],
        CASE
            WHEN K.[CurrentStatusCode]=N'PISHNEVIS' THEN N'پیش‌نویس'
            WHEN K.[CurrentStatusCode]=N'KARTABL_NAMAYANDE_SH' THEN N'کارتابل نماینده شهرستان'
            WHEN K.[CurrentStatusCode]=N'KARTABL_HOZE_TAHGHIGH' THEN N'کارتابل مسئول اسناد و تحقیق حوزه'
            WHEN K.[CurrentStatusCode]=N'KARTABL_HOZE_RAEIS' THEN N'کارتابل رئیس حوزه انتخابیه'
            WHEN K.[CurrentStatusCode]=N'KARTABL_OSTAN_KARDAN' THEN N'کارتابل کاردان استان'
            WHEN K.[CurrentStatusCode]=N'KARTABL_OSTAN_KARSHENAS' THEN N'کارتابل کارشناس استان'
            WHEN K.[CurrentStatusCode]=N'KARTABL_OSTAN_MASOOL' THEN N'کارتابل مسئول واحد استان'
            WHEN K.[CurrentStatusCode]=N'KARTABL_OSTAN_RAEIS' THEN N'کارتابل رئیس دفتر استان'
            WHEN K.[CurrentStatusCode] LIKE N'BARGASHT_%' THEN N'برگشت برای اصلاح'
            ELSE N'در حال گردش'
        END AS [CurrentStatusName]
    INTO #NewsBase
    FROM #ScopedIds X
    INNER JOIN [Akhbar].[Khabar] K ON K.[ShomareKhabar]=X.[ShomareKhabar]
    LEFT JOIN [dbo].[Citys] C ON C.[CityId]=K.[CreateMahal]
    LEFT JOIN [dbo].[Vbl_Users] V ON V.[UserId]=K.[CreateUserId]
    LEFT JOIN [dbo].[DFN] TB ON TB.[PID]=71101 AND TRY_CAST(TB.[Value] AS BIGINT)=K.[TabaqehBandi];

    CREATE INDEX IX_NewsBase_Date ON #NewsBase([CreateDate],[ShomareKhabar]);

    SELECT TOP(8)
        [ShomareKhabar],[OnvanKhabar],[CreateDateTime],[CreateMahal],[CurrentStatusCode],
        [MahalName],[CreateUserName],[TabaqehBandiName],[CurrentStatusName]
    FROM #NewsBase
    WHERE [CreateDate]=@Today
    ORDER BY [ShomareKhabar] DESC;

    SELECT TOP(8)
        [ShomareKhabar],[OnvanKhabar],[CreateDateTime],[CreateMahal],[CurrentStatusCode],
        [MahalName],[CreateUserName],[TabaqehBandiName],[CurrentStatusName]
    FROM #NewsBase
    WHERE [CreateDate]=@Yesterday
    ORDER BY [ShomareKhabar] DESC;

    SELECT TOP(10)
        [ShomareKhabar],[OnvanKhabar],[CreateDateTime],[CreateMahal],[CurrentStatusCode],
        [MahalName],[CreateUserName],[TabaqehBandiName],[CurrentStatusName]
    FROM #NewsBase
    WHERE [CreateDate]>=@WeekStart
      AND [CreateDate]<=@Today
    ORDER BY [ShomareKhabar] DESC;
END
GO
