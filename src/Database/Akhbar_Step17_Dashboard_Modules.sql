USE [MeratDB];
GO

/* ============================================================
   مرحله 17 - نمای کلی داشبورد جامع مرآت
   فقط از Stored Procedure استفاده می‌شود.
   هر کاربر آمار سطح خودش و سطوح پایین‌تر را می‌بیند.
   ============================================================ */

CREATE OR ALTER PROCEDURE [Dashboard].[SP_MainOverview]
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @PostId BIGINT,
        @Mahal BIGINT,
        @RollId INT,
        @AccessLevel NVARCHAR(20),
        @MainHoze BIGINT = NULL;

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

    DECLARE @Scope TABLE ([Mahal] BIGINT NOT NULL PRIMARY KEY);

    IF @AccessLevel = N'SETAD'
    BEGIN
        INSERT INTO @Scope([Mahal]) VALUES(1);
        INSERT INTO @Scope([Mahal])
        SELECT C.[CityId]
        FROM [dbo].[Citys] C
        WHERE C.[IsActive] = 1
          AND C.[CityId] <> 1
          AND NOT EXISTS (SELECT 1 FROM @Scope S WHERE S.[Mahal] = C.[CityId]);
    END
    ELSE IF @AccessLevel = N'OSTAN'
    BEGIN
        INSERT INTO @Scope([Mahal]) VALUES(@Mahal);
        INSERT INTO @Scope([Mahal])
        SELECT C.[CityId]
        FROM [dbo].[Citys] C
        WHERE C.[PCityId] = @Mahal
          AND C.[IsActive] = 1
          AND NOT EXISTS (SELECT 1 FROM @Scope S WHERE S.[Mahal] = C.[CityId]);
    END
    ELSE IF @AccessLevel = N'HOZE'
    BEGIN
        INSERT INTO @Scope([Mahal])
        SELECT C.[CityId]
        FROM [dbo].[Citys] C
        WHERE C.[IsActive] = 1
          AND (C.[CityId] = @Mahal OR C.[CityIdHozeh] = @Mahal);

        IF NOT EXISTS (SELECT 1 FROM @Scope WHERE [Mahal] = @Mahal)
            INSERT INTO @Scope([Mahal]) VALUES(@Mahal);

        SET @MainHoze = @Mahal;
    END
    ELSE
    BEGIN
        INSERT INTO @Scope([Mahal]) VALUES(@Mahal);

        SELECT @MainHoze =
            CASE
                WHEN ISNULL(C.[IsHoze],0) = 1 THEN C.[CityId]
                ELSE NULLIF(C.[CityIdHozeh],0)
            END
        FROM [dbo].[Citys] C
        WHERE C.[CityId] = @Mahal;

        SET @MainHoze = ISNULL(@MainHoze,@Mahal);
    END;

    DECLARE
        @NewsCount BIGINT = 0,
        @ResearchCount BIGINT = 0,
        @CandidateCount BIGINT = 0,
        @CoworkerCount BIGINT = 0,
        @QualificationCount BIGINT = 0;

    /* اخبار: پیش‌نویس پایین‌دست برای بالادست شمرده نمی‌شود. */
    SELECT @NewsCount = COUNT_BIG(1)
    FROM [Akhbar].[Khabar] K
    INNER JOIN @Scope S ON S.[Mahal] = K.[CreateMahal]
    WHERE K.[IsDelete] = 0
      AND
      (
          ISNULL(K.[CurrentStatusCode],N'PISHNEVIS') <> N'PISHNEVIS'
          OR K.[CreateUserId] = @UserId
      );

    /* تحقیقات جاری و انجام‌شده در محدوده قابل مشاهده. */
    SELECT @ResearchCount = COUNT_BIG(1)
    FROM [Tahghighat].[Erja] E
    INNER JOIN @Scope S ON S.[Mahal] = E.[MahalReciver]
    WHERE ISNULL(E.[IsDelete],0) = 0;

    /* اشخاص همکار فعال در محدوده. */
    SELECT @CoworkerCount = COUNT_BIG(1)
    FROM [Hamkari].[PersonHamkari] H
    INNER JOIN @Scope S ON S.[Mahal] = H.[MahalHamkari]
    WHERE H.[IsActive] = 1;

    /* داوطلبان: محدوده بر اساس حوزه انتخابیه پرونده تعیین می‌شود. */
    ;WITH CandidateBase AS
    (
        SELECT DISTINCT A.[ShomarehParvandeh],A.[CodeEntekhabat],A.[CodeHozeh]
        FROM [Davtalab].[AshkhasEntekhabat] A
        INNER JOIN [Entekhabat].[EntekhabatHozeh] H
            ON H.[CodeEntekhabat] = A.[CodeEntekhabat]
           AND H.[CodeHozeh] = A.[CodeHozeh]
        WHERE
            (@AccessLevel = N'SETAD')
            OR (@AccessLevel = N'OSTAN' AND H.[Ostan] = @Mahal)
            OR (@AccessLevel IN (N'HOZE',N'SHAHR') AND H.[MarkazHozeh] = @MainHoze)
    )
    SELECT @CandidateCount = COUNT_BIG(1) FROM CandidateBase;

    /* خلاصه صلاحیت برای داوطلبان قابل مشاهده. */
    ;WITH QualificationBase AS
    (
        SELECT DISTINCT K.[ShomarehParvandeh],K.[CodeEntekhabat]
        FROM [Davtalab].[AshkhasKholasehSalahiyat] K
        INNER JOIN [Davtalab].[AshkhasEntekhabat] A
            ON A.[ShomarehParvandeh] = K.[ShomarehParvandeh]
           AND A.[CodeEntekhabat] = K.[CodeEntekhabat]
        INNER JOIN [Entekhabat].[EntekhabatHozeh] H
            ON H.[CodeEntekhabat] = A.[CodeEntekhabat]
           AND H.[CodeHozeh] = A.[CodeHozeh]
        WHERE ISNULL(K.[IsDelete],0) = 0
          AND
          (
              (@AccessLevel = N'SETAD')
              OR (@AccessLevel = N'OSTAN' AND H.[Ostan] = @Mahal)
              OR (@AccessLevel IN (N'HOZE',N'SHAHR') AND H.[MarkazHozeh] = @MainHoze)
          )
    )
    SELECT @QualificationCount = COUNT_BIG(1) FROM QualificationBase;

    SELECT
        @AccessLevel AS [AccessLevel],
        @NewsCount AS [NewsCount],
        @ResearchCount AS [ResearchCount],
        @CandidateCount AS [CandidateCount],
        @CoworkerCount AS [CoworkerCount],
        @QualificationCount AS [QualificationCount];
END
GO
