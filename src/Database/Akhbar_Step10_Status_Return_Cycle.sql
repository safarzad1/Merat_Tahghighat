USE [MeratDB]
GO

/* ============================================================
   مرحله 10 اخبار
   - وضعیت جاری واحد روی خود خبر
   - کارتابل / ارسال شده / برگشت شده
   - تایید و ارسال به بالاتر
   - برگشت به فرستنده با دلیل و تگ‌های اشکالات خبر (DFN PID=71104)
   - چرخه کامل خبر
   ============================================================ */

/* ---------- وضعیت جاری روی خود خبر ---------- */
IF COL_LENGTH(N'Akhbar.Khabar', N'CurrentStatusCode') IS NULL
    ALTER TABLE [Akhbar].[Khabar] ADD [CurrentStatusCode] NVARCHAR(60) NULL;
GO
IF COL_LENGTH(N'Akhbar.Khabar', N'LastActionCode') IS NULL
    ALTER TABLE [Akhbar].[Khabar] ADD [LastActionCode] NVARCHAR(60) NULL;
GO
IF COL_LENGTH(N'Akhbar.Khabar', N'CurrentUserId') IS NULL
    ALTER TABLE [Akhbar].[Khabar] ADD [CurrentUserId] BIGINT NULL;
GO
IF COL_LENGTH(N'Akhbar.Khabar', N'CurrentPostId') IS NULL
    ALTER TABLE [Akhbar].[Khabar] ADD [CurrentPostId] BIGINT NULL;
GO
IF COL_LENGTH(N'Akhbar.Khabar', N'CurrentMahal') IS NULL
    ALTER TABLE [Akhbar].[Khabar] ADD [CurrentMahal] BIGINT NULL;
GO
IF COL_LENGTH(N'Akhbar.Khabar', N'StatusDateTime') IS NULL
    ALTER TABLE [Akhbar].[Khabar] ADD [StatusDateTime] NVARCHAR(20) NULL;
GO

IF COL_LENGTH(N'Akhbar.KhabarGardeshLog', N'ActionCode') IS NULL
    ALTER TABLE [Akhbar].[KhabarGardeshLog] ADD [ActionCode] NVARCHAR(60) NULL;
GO
ALTER TABLE [Akhbar].[KhabarGardeshLog] ALTER COLUMN [Tozihat] NVARCHAR(2000) NULL;
GO
IF COL_LENGTH(N'Akhbar.KhabarGardeshLog', N'EshkalatIds') IS NULL
    ALTER TABLE [Akhbar].[KhabarGardeshLog] ADD [EshkalatIds] NVARCHAR(500) NULL;
GO

/* مقداردهی وضعیت رکوردهای موجود */
UPDATE K
SET
    [CurrentStatusCode] = CASE
        WHEN KT.[CurrentUserId] IS NULL THEN N'PISHNEVIS'
        WHEN KT.[CurrentPostId] = 70 THEN N'KARTABL_NAMAYANDE_SH'
        WHEN KT.[CurrentPostId] = 61 THEN N'KARTABL_HOZE_TAHGHIGH'
        WHEN KT.[CurrentPostId] = 60 THEN N'KARTABL_HOZE_RAEIS'
        WHEN KT.[CurrentPostId] = 53 THEN N'KARTABL_OSTAN_KARDAN'
        WHEN KT.[CurrentPostId] = 52 THEN N'KARTABL_OSTAN_KARSHENAS'
        WHEN KT.[CurrentPostId] = 51 THEN N'KARTABL_OSTAN_MASOOL'
        WHEN KT.[CurrentPostId] = 50 THEN N'KARTABL_OSTAN_RAEIS'
        ELSE N'KARTABL_OTHER'
    END,
    [LastActionCode] = CASE WHEN KT.[CurrentUserId] IS NULL THEN N'IJAD_KHABAR' ELSE ISNULL(K.[LastActionCode], N'ERSAL_KHABAR') END,
    [CurrentUserId] = ISNULL(KT.[CurrentUserId], K.[CreateUserId]),
    [CurrentPostId] = ISNULL(KT.[CurrentPostId], K.[CreatePostId]),
    [CurrentMahal] = ISNULL(KT.[CurrentMahal], K.[CreateMahal]),
    [StatusDateTime] = ISNULL(K.[StatusDateTime], K.[CreateDateTime])
FROM [Akhbar].[Khabar] K
OUTER APPLY
(
    SELECT TOP (1) X.[CurrentUserId], X.[CurrentPostId], X.[CurrentMahal]
    FROM [Akhbar].[KhabarKartabl] X
    WHERE X.[ShomareKhabar] = K.[ShomareKhabar] AND X.[IsActive] = 1
    ORDER BY X.[KartablId] DESC
) KT
WHERE K.[CurrentStatusCode] IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE [name]=N'DF_Akhbar_Khabar_CurrentStatusCode' AND [parent_object_id]=OBJECT_ID(N'[Akhbar].[Khabar]'))
BEGIN
    ALTER TABLE [Akhbar].[Khabar] ADD CONSTRAINT [DF_Akhbar_Khabar_CurrentStatusCode] DEFAULT(N'PISHNEVIS') FOR [CurrentStatusCode];
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE [name] = N'IX_Akhbar_Khabar_CurrentStatus'
      AND [object_id] = OBJECT_ID(N'[Akhbar].[Khabar]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Akhbar_Khabar_CurrentStatus]
    ON [Akhbar].[Khabar]([CurrentUserId], [CurrentPostId], [CurrentMahal], [CurrentStatusCode], [IsDelete], [ShomareKhabar] DESC)
    INCLUDE ([OnvanKhabar], [CreateUserId], [CreateDateTime], [LastActionCode]);
END
GO

/* ---------- درج خبر: پیش‌نویس در اختیار ایجادکننده ---------- */
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
    SELECT @CreateMahal=[Mahal], @CreatePostId=[PostId]
    FROM [dbo].[Users]
    WHERE [UserId]=@CreateUserId AND [IsActive]=1;

    IF @CreateMahal IS NULL OR @CreatePostId IS NULL
        THROW 51000, N'کاربر فعال برای ثبت خبر یافت نشد.', 1;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[DFN] WHERE [ID]=@ManbaKhabarId AND [PID]=10201)
        THROW 51000, N'منبع خبر معتبر نیست.', 1;

    IF @NoghteKhabarkhizId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM [Akhbar].[NoghatKhabarkhiz]
        WHERE [NoghteKhabarkhizId]=@NoghteKhabarkhizId AND [Mahal]=@CreateMahal AND [IsActive]=1
    ) THROW 51000, N'نقطه خبرخیز انتخاب‌شده معتبر نیست.', 1;

    IF NULLIF(LTRIM(RTRIM(@OnvanKhabar)),N'') IS NULL THROW 51000, N'عنوان خبر اجباری است.', 1;
    IF NULLIF(LTRIM(RTRIM(@SharhKhabar)),N'') IS NULL THROW 51000, N'شرح خبر اجباری است.', 1;
    IF NULLIF(LTRIM(RTRIM(@MolahazatKhabar)),N'') IS NULL THROW 51000, N'ملاحظات خبر اجباری است.', 1;
    IF @NoghteKhabarkhizId IS NULL AND NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)),N'') IS NULL
        THROW 51000, N'در صورت عدم انتخاب نقطه خبرخیز، محل نقطه خبرخیز اجباری است.', 1;

    DECLARE @Now NVARCHAR(20)=[dbo].[FarsiDateTimeNow]();

    INSERT INTO [Akhbar].[Khabar]
    (
        [TabaqehBandi],[ManbaKhabarId],[NoeKhabar],[TarikhNameh],[ShomareNameh],
        [OnvanKhabar],[SharhKhabar],[MolahazatKhabar],[NoghteKhabarkhizId],[MahalNoghteKhabarkhiz],
        [TarikhEnteshar],[CreateMahal],[CreatePostId],[CreateUserId],[CreateDateTime],[IsDelete],
        [CurrentStatusCode],[LastActionCode],[CurrentUserId],[CurrentPostId],[CurrentMahal],[StatusDateTime]
    )
    VALUES
    (
        @TabaqehBandi,@ManbaKhabarId,@NoeKhabar,NULLIF(LTRIM(RTRIM(@TarikhNameh)),N''),NULLIF(LTRIM(RTRIM(@ShomareNameh)),N''),
        LTRIM(RTRIM(@OnvanKhabar)),@SharhKhabar,@MolahazatKhabar,@NoghteKhabarkhizId,NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)),N''),
        NULLIF(LTRIM(RTRIM(@TarikhEnteshar)),N''),@CreateMahal,@CreatePostId,@CreateUserId,@Now,0,
        N'PISHNEVIS',N'IJAD_KHABAR',@CreateUserId,@CreatePostId,@CreateMahal,@Now
    );

    SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS [ShomareKhabar];
END
GO

/* ---------- ارسال یا تایید و ارسال به بالاتر ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_SendKhabar]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @FromMahal BIGINT,@FromPostId BIGINT,@CreateUserId BIGINT,@CurrentUserId BIGINT,
        @HozeMahal BIGINT,@OstanMahal BIGINT,@ToUserId BIGINT,@ToPostId BIGINT,@ToMahal BIGINT,
        @ToFullName NVARCHAR(500),@ToOnvanPost NVARCHAR(500),@ToNameMahal NVARCHAR(1000),
        @StatusCode NVARCHAR(60),@ActionCode NVARCHAR(60),@NoeEghdam NVARCHAR(50),@Now NVARCHAR(20);

    SELECT @FromMahal=U.[Mahal], @FromPostId=U.[PostId]
    FROM [dbo].[Users] U
    WHERE U.[UserId]=@UserId AND U.[IsActive]=1;
    IF @FromMahal IS NULL OR @FromPostId IS NULL THROW 51000,N'کاربر فعال برای ارسال خبر یافت نشد.',1;

    SELECT @CreateUserId=K.[CreateUserId]
    FROM [Akhbar].[Khabar] K
    WHERE K.[ShomareKhabar]=@ShomareKhabar AND K.[IsDelete]=0;
    IF @CreateUserId IS NULL THROW 51000,N'خبر مورد نظر یافت نشد.',1;

    SELECT @CurrentUserId=KT.[CurrentUserId]
    FROM [Akhbar].[KhabarKartabl] KT
    WHERE KT.[ShomareKhabar]=@ShomareKhabar AND KT.[IsActive]=1;

    IF @CurrentUserId IS NULL
    BEGIN
        IF @CreateUserId<>@UserId THROW 51000,N'اجازه ارسال این خبر را ندارید.',1;
        SET @NoeEghdam=N'ارسال خبر';
    END
    ELSE
    BEGIN
        IF @CurrentUserId<>@UserId THROW 51000,N'این خبر در کارتابل شما قرار ندارد.',1;
        SET @NoeEghdam=N'تأیید و ارسال';
    END

    DECLARE @Candidates TABLE([Priority] INT NOT NULL,[PostId] BIGINT NOT NULL,[Mahal] BIGINT NOT NULL);

    IF @FromPostId IN (70,61,60)
    BEGIN
        SELECT @HozeMahal=CASE WHEN ISNULL(C.[IsHoze],0)=1 THEN C.[CityId] ELSE C.[CityIdHozeh] END
        FROM [dbo].[Citys] C WHERE C.[CityId]=@FromMahal;
        IF @HozeMahal IS NULL THROW 51000,N'حوزه انتخابیه بالادست مشخص نشد.',1;
        SELECT @OstanMahal=C.[PCityId] FROM [dbo].[Citys] C WHERE C.[CityId]=@HozeMahal;
        IF @OstanMahal IS NULL THROW 51000,N'استان بالادست مشخص نشد.',1;
    END

    IF @FromPostId=70 INSERT INTO @Candidates VALUES (10,61,@HozeMahal),(20,60,@HozeMahal),(30,53,@OstanMahal),(40,52,@OstanMahal),(50,51,@OstanMahal),(60,50,@OstanMahal);
    ELSE IF @FromPostId=61 INSERT INTO @Candidates VALUES (10,60,@HozeMahal),(20,53,@OstanMahal),(30,52,@OstanMahal),(40,51,@OstanMahal),(50,50,@OstanMahal);
    ELSE IF @FromPostId=60 INSERT INTO @Candidates VALUES (10,53,@OstanMahal),(20,52,@OstanMahal),(30,51,@OstanMahal),(40,50,@OstanMahal);
    ELSE IF @FromPostId=53 INSERT INTO @Candidates VALUES (10,52,@FromMahal),(20,51,@FromMahal),(30,50,@FromMahal);
    ELSE IF @FromPostId=52 INSERT INTO @Candidates VALUES (10,51,@FromMahal),(20,50,@FromMahal);
    ELSE IF @FromPostId=51 INSERT INTO @Candidates VALUES (10,50,@FromMahal);
    ELSE IF @FromPostId=50 THROW 51000,N'مسیر بعد از رئیس دفتر استان هنوز تعریف نشده است.',1;
    ELSE THROW 51000,N'مسیر گردش برای سمت فعلی هنوز تعریف نشده است.',1;

    SELECT TOP (1) @ToUserId=U.[UserId],@ToPostId=C.[PostId],@ToMahal=C.[Mahal]
    FROM @Candidates C
    INNER JOIN [dbo].[Users] U ON U.[PostId]=C.[PostId] AND U.[Mahal]=C.[Mahal] AND U.[IsActive]=1
    ORDER BY C.[Priority],U.[UserId];
    IF @ToUserId IS NULL THROW 51000,N'کاربر فعالی در مسیر بالادست برای دریافت خبر یافت نشد.',1;

    SET @StatusCode=CASE @ToPostId
        WHEN 70 THEN N'KARTABL_NAMAYANDE_SH' WHEN 61 THEN N'KARTABL_HOZE_TAHGHIGH' WHEN 60 THEN N'KARTABL_HOZE_RAEIS'
        WHEN 53 THEN N'KARTABL_OSTAN_KARDAN' WHEN 52 THEN N'KARTABL_OSTAN_KARSHENAS' WHEN 51 THEN N'KARTABL_OSTAN_MASOOL'
        WHEN 50 THEN N'KARTABL_OSTAN_RAEIS' ELSE N'KARTABL_OTHER' END;

    SET @ActionCode=CASE @FromPostId
        WHEN 70 THEN N'ERSAL_NAMAYANDE_SH'
        WHEN 61 THEN N'TAEED_ERSAL_HOZE_TAHGHIGH'
        WHEN 60 THEN N'TAEED_ERSAL_HOZE_RAEIS'
        WHEN 53 THEN N'TAEED_ERSAL_OSTAN_KARDAN'
        WHEN 52 THEN N'TAEED_ERSAL_OSTAN_KARSHENAS'
        WHEN 51 THEN N'TAEED_ERSAL_OSTAN_MASOOL'
        WHEN 50 THEN N'TAEED_ERSAL_OSTAN_RAEIS'
        ELSE N'ERSAL_KHABAR' END;

    SELECT TOP (1) @ToFullName=ISNULL(V.[FullName],N''),@ToOnvanPost=ISNULL(V.[OnvanPost],N''),@ToNameMahal=ISNULL(V.[NameMahal],N'')
    FROM [dbo].[Vbl_Users] V WHERE V.[UserId]=@ToUserId;

    SET @Now=[dbo].[FarsiDateTimeNow]();
    BEGIN TRAN;
      UPDATE [Akhbar].[KhabarKartabl] SET [IsActive]=0 WHERE [ShomareKhabar]=@ShomareKhabar AND [IsActive]=1;
      INSERT INTO [Akhbar].[KhabarKartabl]
      ([ShomareKhabar],[CurrentUserId],[CurrentPostId],[CurrentMahal],[FromUserId],[FromPostId],[FromMahal],[ErsalDateTime],[IsActive])
      VALUES(@ShomareKhabar,@ToUserId,@ToPostId,@ToMahal,@UserId,@FromPostId,@FromMahal,@Now,1);

      INSERT INTO [Akhbar].[KhabarGardeshLog]
      ([ShomareKhabar],[FromUserId],[FromPostId],[FromMahal],[ToUserId],[ToPostId],[ToMahal],[NoeEghdam],[Tozihat],[CreateUserId],[CreateDateTime],[ActionCode],[EshkalatIds])
      VALUES(@ShomareKhabar,@UserId,@FromPostId,@FromMahal,@ToUserId,@ToPostId,@ToMahal,@NoeEghdam,NULL,@UserId,@Now,@ActionCode,NULL);

      UPDATE [Akhbar].[Khabar]
      SET [CurrentStatusCode]=@StatusCode,[LastActionCode]=@ActionCode,[CurrentUserId]=@ToUserId,[CurrentPostId]=@ToPostId,[CurrentMahal]=@ToMahal,[StatusDateTime]=@Now
      WHERE [ShomareKhabar]=@ShomareKhabar;
    COMMIT;

    SELECT @ShomareKhabar [ShomareKhabar],@ToUserId [ToUserId],@ToPostId [ToPostId],@ToMahal [ToMahal],
           @ToFullName [ToFullName],@ToOnvanPost [ToOnvanPost],@ToNameMahal [ToNameMahal],@StatusCode [CurrentStatusCode],N'ارسال شد' [StateName];
END
GO

/* ---------- برگشت خبر به آخرین فرستنده پایین‌دست ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_ReturnKhabar]
    @ShomareKhabar BIGINT,
    @UserId BIGINT,
    @Tozihat NVARCHAR(2000),
    @EshkalatIds NVARCHAR(500)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@Tozihat)),N'') IS NULL
        THROW 51000,N'توضیح علت برگشت اجباری است.',1;

    DECLARE @FromPostId BIGINT,@FromMahal BIGINT,@ToUserId BIGINT,@ToPostId BIGINT,@ToMahal BIGINT,
            @ToFullName NVARCHAR(500),@ToOnvanPost NVARCHAR(500),@ToNameMahal NVARCHAR(1000),
            @StatusCode NVARCHAR(60),@ActionCode NVARCHAR(60),@Now NVARCHAR(20);

    SELECT @FromPostId=U.[PostId],@FromMahal=U.[Mahal]
    FROM [dbo].[Users] U WHERE U.[UserId]=@UserId AND U.[IsActive]=1;
    IF @FromPostId IS NULL THROW 51000,N'کاربر فعال یافت نشد.',1;

    IF NOT EXISTS (
        SELECT 1 FROM [Akhbar].[KhabarKartabl] KT
        WHERE KT.[ShomareKhabar]=@ShomareKhabar AND KT.[IsActive]=1
          AND KT.[CurrentUserId]=@UserId AND KT.[CurrentPostId]=@FromPostId AND KT.[CurrentMahal]=@FromMahal
    ) THROW 51000,N'این خبر در کارتابل جاری شما نیست.',1;

    /* آخرین ارسال رو به بالا که این کاربر گیرنده آن بوده، فرستنده واقعی برای برگشت است. */
    SELECT TOP (1) @ToUserId=L.[FromUserId],@ToPostId=L.[FromPostId],@ToMahal=L.[FromMahal]
    FROM [Akhbar].[KhabarGardeshLog] L
    WHERE L.[ShomareKhabar]=@ShomareKhabar
      AND L.[ToUserId]=@UserId
      AND ISNULL(L.[ActionCode],N'') NOT LIKE N'BARGASHT_%'
      AND L.[NoeEghdam] IN (N'ارسال خبر',N'تأیید و ارسال')
    ORDER BY L.[LogId] DESC;

    IF @ToUserId IS NULL THROW 51000,N'فرستنده قبلی خبر برای برگشت یافت نشد.',1;

    SET @StatusCode=CASE @ToPostId
        WHEN 70 THEN N'BARGASHT_NAMAYANDE_SH' WHEN 61 THEN N'BARGASHT_HOZE_TAHGHIGH' WHEN 60 THEN N'BARGASHT_HOZE_RAEIS'
        WHEN 53 THEN N'BARGASHT_OSTAN_KARDAN' WHEN 52 THEN N'BARGASHT_OSTAN_KARSHENAS' WHEN 51 THEN N'BARGASHT_OSTAN_MASOOL'
        WHEN 50 THEN N'BARGASHT_OSTAN_RAEIS' ELSE N'BARGASHT_OTHER' END;

    SET @ActionCode=CASE @FromPostId
        WHEN 61 THEN N'BARGASHT_HOZE_TAHGHIGH' WHEN 60 THEN N'BARGASHT_HOZE_RAEIS'
        WHEN 53 THEN N'BARGASHT_OSTAN_KARDAN' WHEN 52 THEN N'BARGASHT_OSTAN_KARSHENAS'
        WHEN 51 THEN N'BARGASHT_OSTAN_MASOOL' WHEN 50 THEN N'BARGASHT_OSTAN_RAEIS'
        ELSE N'BARGASHT_KHABAR' END;

    IF NULLIF(LTRIM(RTRIM(@EshkalatIds)),N'') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM STRING_SPLIT(@EshkalatIds,N',') S
           WHERE TRY_CAST(LTRIM(RTRIM(S.[value])) AS BIGINT) IS NULL
              OR NOT EXISTS (SELECT 1 FROM [dbo].[DFN] D WHERE D.[ID]=TRY_CAST(LTRIM(RTRIM(S.[value])) AS BIGINT) AND D.[PID]=71104)
       ) THROW 51000,N'یکی از تگ‌های اشکال خبر معتبر نیست.',1;

    SELECT TOP (1) @ToFullName=ISNULL(V.[FullName],N''),@ToOnvanPost=ISNULL(V.[OnvanPost],N''),@ToNameMahal=ISNULL(V.[NameMahal],N'')
    FROM [dbo].[Vbl_Users] V WHERE V.[UserId]=@ToUserId;

    SET @Now=[dbo].[FarsiDateTimeNow]();
    BEGIN TRAN;
      UPDATE [Akhbar].[KhabarKartabl] SET [IsActive]=0 WHERE [ShomareKhabar]=@ShomareKhabar AND [IsActive]=1;
      INSERT INTO [Akhbar].[KhabarKartabl]
      ([ShomareKhabar],[CurrentUserId],[CurrentPostId],[CurrentMahal],[FromUserId],[FromPostId],[FromMahal],[ErsalDateTime],[IsActive])
      VALUES(@ShomareKhabar,@ToUserId,@ToPostId,@ToMahal,@UserId,@FromPostId,@FromMahal,@Now,1);

      INSERT INTO [Akhbar].[KhabarGardeshLog]
      ([ShomareKhabar],[FromUserId],[FromPostId],[FromMahal],[ToUserId],[ToPostId],[ToMahal],[NoeEghdam],[Tozihat],[CreateUserId],[CreateDateTime],[ActionCode],[EshkalatIds])
      VALUES(@ShomareKhabar,@UserId,@FromPostId,@FromMahal,@ToUserId,@ToPostId,@ToMahal,N'برگشت خبر',LTRIM(RTRIM(@Tozihat)),@UserId,@Now,@ActionCode,NULLIF(LTRIM(RTRIM(@EshkalatIds)),N''));

      UPDATE [Akhbar].[Khabar]
      SET [CurrentStatusCode]=@StatusCode,[LastActionCode]=@ActionCode,[CurrentUserId]=@ToUserId,[CurrentPostId]=@ToPostId,[CurrentMahal]=@ToMahal,[StatusDateTime]=@Now
      WHERE [ShomareKhabar]=@ShomareKhabar;
    COMMIT;

    SELECT @ShomareKhabar [ShomareKhabar],@ToUserId [ToUserId],@ToPostId [ToPostId],@ToMahal [ToMahal],
           @ToFullName [ToFullName],@ToOnvanPost [ToOnvanPost],@ToNameMahal [ToNameMahal],@StatusCode [CurrentStatusCode],N'برگشت شد' [StateName];
END
GO

/* ---------- تعداد سه باکس ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarBoxCounts]
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PostId BIGINT,@Mahal BIGINT;
    SELECT @PostId=[PostId],@Mahal=[Mahal] FROM [dbo].[Users] WHERE [UserId]=@UserId AND [IsActive]=1;
    IF @PostId IS NULL THROW 51000,N'کاربر فعال یافت نشد.',1;

    SELECT
      (SELECT COUNT(*) FROM [Akhbar].[Khabar] K WHERE K.[IsDelete]=0 AND
        ((K.[CurrentStatusCode]=N'PISHNEVIS' AND K.[CreateUserId]=@UserId)
          OR (K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal AND K.[CurrentStatusCode] LIKE N'KARTABL_%'))) [KartablCount],
      (SELECT COUNT(DISTINCT L.[ShomareKhabar])
       FROM [Akhbar].[KhabarGardeshLog] L
       INNER JOIN [Akhbar].[Khabar] K ON K.[ShomareKhabar]=L.[ShomareKhabar] AND K.[IsDelete]=0
       WHERE L.[FromUserId]=@UserId AND L.[FromPostId]=@PostId AND L.[FromMahal]=@Mahal
         AND L.[NoeEghdam] IN (N'ارسال خبر',N'تأیید و ارسال')
         AND NOT (K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal)) [SentCount],
      (SELECT COUNT(*) FROM [Akhbar].[Khabar] K WHERE K.[IsDelete]=0
         AND K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal
         AND K.[CurrentStatusCode] LIKE N'BARGASHT_%') [ReturnedCount];
END
GO

/* ---------- لیست سه باکس، صفحه‌بندی SQL-side ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPage]
    @UserId BIGINT,@Page INT,@SizePage INT,@SortIndex INT=1,@SECDEC INT=2,@Search NVARCHAR(200)=N'',@BoxType INT=1
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page<1 SET @Page=1; IF @SizePage<1 SET @SizePage=9; IF @SizePage>100 SET @SizePage=100;
    IF @SortIndex NOT BETWEEN 1 AND 5 SET @SortIndex=1; IF @SECDEC NOT IN(1,2) SET @SECDEC=2; IF @BoxType NOT IN(1,2,3) SET @BoxType=1;
    SET @Search=[dbo].[NormalizePersianText](ISNULL(LTRIM(RTRIM(@Search)),N''));

    DECLARE @PostId BIGINT,@Mahal BIGINT;
    SELECT @PostId=[PostId],@Mahal=[Mahal] FROM [dbo].[Users] WHERE [UserId]=@UserId AND [IsActive]=1;
    IF @PostId IS NULL THROW 51000,N'کاربر فعال یافت نشد.',1;

    ;WITH B AS
    (
      SELECT K.[ShomareKhabar],K.[TabaqehBandi],TB.[NameFarsi] [TabaqehBandiName],K.[ManbaKhabarId],M.[NameFarsi] [ManbaKhabarName],
             K.[NoeKhabar],NK.[NameFarsi] [NoeKhabarName],K.[TarikhNameh],K.[ShomareNameh],K.[OnvanKhabar],K.[TarikhEnteshar],
             K.[CreateDateTime],K.[LastEditDateTime],K.[CreateUserId],K.[CreatePostId],K.[CreateMahal],
             K.[CurrentStatusCode],K.[LastActionCode],K.[CurrentUserId],K.[CurrentPostId],K.[CurrentMahal],K.[StatusDateTime],
             CASE K.[CurrentStatusCode]
               WHEN N'PISHNEVIS' THEN N'پیش‌نویس'
               WHEN N'KARTABL_NAMAYANDE_SH' THEN N'در کارتابل نماینده شهرستان'
               WHEN N'KARTABL_HOZE_TAHGHIGH' THEN N'در کارتابل مسئول اسناد و تحقیق حوزه'
               WHEN N'KARTABL_HOZE_RAEIS' THEN N'در کارتابل رئیس حوزه انتخابیه'
               WHEN N'KARTABL_OSTAN_KARDAN' THEN N'در کارتابل کاردان استان'
               WHEN N'KARTABL_OSTAN_KARSHENAS' THEN N'در کارتابل کارشناس استان'
               WHEN N'KARTABL_OSTAN_MASOOL' THEN N'در کارتابل مسئول واحد استان'
               WHEN N'KARTABL_OSTAN_RAEIS' THEN N'در کارتابل رئیس دفتر استان'
               WHEN N'BARGASHT_NAMAYANDE_SH' THEN N'برگشت شده به نماینده شهرستان'
               WHEN N'BARGASHT_HOZE_TAHGHIGH' THEN N'برگشت شده به مسئول اسناد و تحقیق حوزه'
               WHEN N'BARGASHT_HOZE_RAEIS' THEN N'برگشت شده به رئیس حوزه'
               WHEN N'BARGASHT_OSTAN_KARDAN' THEN N'برگشت شده به کاردان استان'
               WHEN N'BARGASHT_OSTAN_KARSHENAS' THEN N'برگشت شده به کارشناس استان'
               WHEN N'BARGASHT_OSTAN_MASOOL' THEN N'برگشت شده به مسئول واحد استان'
               WHEN N'BARGASHT_OSTAN_RAEIS' THEN N'برگشت شده به رئیس دفتر استان'
               ELSE N'در حال گردش' END [CurrentStatusName],
             ISNULL(CU.[FullName],N'') [CurrentUserName],ISNULL(CP.[OnvanPost],N'') [CurrentPostName],ISNULL(CU.[NameMahal],N'') [CurrentMahalName],
             CAST(CASE WHEN K.[CreateUserId]=@UserId THEN 1 ELSE 0 END AS BIT) [IsOwner],
             CAST(CASE WHEN K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal THEN 1 ELSE 0 END AS BIT) [IsInbox],
             LS.[LastSendDateTime]
      FROM [Akhbar].[Khabar] K
      INNER JOIN [dbo].[DFN] M ON M.[ID]=K.[ManbaKhabarId] AND M.[PID]=10201
      LEFT JOIN [dbo].[DFN] TB ON TB.[PID]=71101 AND TRY_CAST(TB.[Value] AS BIGINT)=K.[TabaqehBandi]
      LEFT JOIN [dbo].[DFN] NK ON NK.[PID]=71102 AND TRY_CAST(NK.[Value] AS BIGINT)=K.[NoeKhabar]
      LEFT JOIN [dbo].[Vbl_Users] CU ON CU.[UserId]=K.[CurrentUserId]
      LEFT JOIN [dbo].[Posts] CP ON CP.[PostId]=K.[CurrentPostId]
      OUTER APPLY (
        SELECT TOP(1) L.[CreateDateTime] [LastSendDateTime]
        FROM [Akhbar].[KhabarGardeshLog] L
        WHERE L.[ShomareKhabar]=K.[ShomareKhabar] AND L.[FromUserId]=@UserId AND L.[FromPostId]=@PostId AND L.[FromMahal]=@Mahal
          AND L.[NoeEghdam] IN(N'ارسال خبر',N'تأیید و ارسال')
        ORDER BY L.[LogId] DESC
      ) LS
      WHERE K.[IsDelete]=0 AND
        (
          (@BoxType=1 AND ((K.[CurrentStatusCode]=N'PISHNEVIS' AND K.[CreateUserId]=@UserId)
             OR (K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal AND K.[CurrentStatusCode] LIKE N'KARTABL_%')))
          OR (@BoxType=2 AND LS.[LastSendDateTime] IS NOT NULL AND NOT(K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal))
          OR (@BoxType=3 AND K.[CurrentUserId]=@UserId AND K.[CurrentPostId]=@PostId AND K.[CurrentMahal]=@Mahal AND K.[CurrentStatusCode] LIKE N'BARGASHT_%')
        )
        AND (@Search=N'' OR [dbo].[NormalizePersianText](K.[OnvanKhabar]) LIKE N'%'+@Search+N'%'
             OR [dbo].[NormalizePersianText](ISNULL(K.[ShomareNameh],N'')) LIKE N'%'+@Search+N'%'
             OR [dbo].[NormalizePersianText](M.[NameFarsi]) LIKE N'%'+@Search+N'%'
             OR CAST(K.[ShomareKhabar] AS NVARCHAR(30)) LIKE N'%'+@Search+N'%')
    )
    SELECT ROW_NUMBER() OVER(ORDER BY
      CASE WHEN @SortIndex=1 AND @SECDEC=1 THEN [ShomareKhabar] END ASC,CASE WHEN @SortIndex=1 AND @SECDEC=2 THEN [ShomareKhabar] END DESC,
      CASE WHEN @SortIndex=2 AND @SECDEC=1 THEN [OnvanKhabar] END ASC,CASE WHEN @SortIndex=2 AND @SECDEC=2 THEN [OnvanKhabar] END DESC,
      CASE WHEN @SortIndex=5 AND @SECDEC=1 THEN [CreateDateTime] END ASC,CASE WHEN @SortIndex=5 AND @SECDEC=2 THEN [CreateDateTime] END DESC,[ShomareKhabar] DESC) [Rdf],
      *, (SELECT COUNT(*) FROM B) [TotalCount]
    FROM B
    ORDER BY
      CASE WHEN @SortIndex=1 AND @SECDEC=1 THEN [ShomareKhabar] END ASC,CASE WHEN @SortIndex=1 AND @SECDEC=2 THEN [ShomareKhabar] END DESC,
      CASE WHEN @SortIndex=2 AND @SECDEC=1 THEN [OnvanKhabar] END ASC,CASE WHEN @SortIndex=2 AND @SECDEC=2 THEN [OnvanKhabar] END DESC,
      CASE WHEN @SortIndex=5 AND @SECDEC=1 THEN [CreateDateTime] END ASC,CASE WHEN @SortIndex=5 AND @SECDEC=2 THEN [CreateDateTime] END DESC,[ShomareKhabar] DESC
    OFFSET (@Page-1)*@SizePage ROWS FETCH NEXT @SizePage ROWS ONLY;
END
GO

/* ---------- جزئیات با وضعیت جاری ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarById]
    @ShomareKhabar BIGINT,@UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IsAdmin BIT=0;
    IF EXISTS(SELECT 1 FROM [dbo].[Users] U INNER JOIN [dbo].[Posts] P ON P.[PostId]=U.[PostId] WHERE U.[UserId]=@UserId AND U.[IsActive]=1 AND P.[RollId]=1) SET @IsAdmin=1;

    SELECT K.[ShomareKhabar],K.[TabaqehBandi],TB.[NameFarsi] [TabaqehBandiName],K.[ManbaKhabarId],M.[NameFarsi] [ManbaKhabarName],
           K.[NoeKhabar],NK.[NameFarsi] [NoeKhabarName],K.[TarikhNameh],K.[ShomareNameh],K.[OnvanKhabar],K.[SharhKhabar],K.[MolahazatKhabar],
           K.[NoghteKhabarkhizId],N.[Onvan] [NoghteKhabarkhizName],K.[MahalNoghteKhabarkhiz],K.[TarikhEnteshar],
           K.[CreateMahal],K.[CreatePostId],K.[CreateUserId],K.[CreateDateTime],K.[LastEditUserId],K.[LastEditDateTime],
           K.[CurrentStatusCode],K.[LastActionCode],K.[CurrentUserId],K.[CurrentPostId],K.[CurrentMahal],K.[StatusDateTime],
           CASE K.[CurrentStatusCode]
             WHEN N'PISHNEVIS' THEN N'پیش‌نویس' WHEN N'KARTABL_NAMAYANDE_SH' THEN N'در کارتابل نماینده شهرستان'
             WHEN N'KARTABL_HOZE_TAHGHIGH' THEN N'در کارتابل مسئول اسناد و تحقیق حوزه' WHEN N'KARTABL_HOZE_RAEIS' THEN N'در کارتابل رئیس حوزه انتخابیه'
             WHEN N'KARTABL_OSTAN_KARDAN' THEN N'در کارتابل کاردان استان' WHEN N'KARTABL_OSTAN_KARSHENAS' THEN N'در کارتابل کارشناس استان'
             WHEN N'KARTABL_OSTAN_MASOOL' THEN N'در کارتابل مسئول واحد استان' WHEN N'KARTABL_OSTAN_RAEIS' THEN N'در کارتابل رئیس دفتر استان'
             WHEN N'BARGASHT_NAMAYANDE_SH' THEN N'برگشت شده به نماینده شهرستان' WHEN N'BARGASHT_HOZE_TAHGHIGH' THEN N'برگشت شده به مسئول اسناد و تحقیق حوزه'
             WHEN N'BARGASHT_HOZE_RAEIS' THEN N'برگشت شده به رئیس حوزه' WHEN N'BARGASHT_OSTAN_KARDAN' THEN N'برگشت شده به کاردان استان'
             WHEN N'BARGASHT_OSTAN_KARSHENAS' THEN N'برگشت شده به کارشناس استان' WHEN N'BARGASHT_OSTAN_MASOOL' THEN N'برگشت شده به مسئول واحد استان'
             WHEN N'BARGASHT_OSTAN_RAEIS' THEN N'برگشت شده به رئیس دفتر استان' ELSE N'در حال گردش' END [CurrentStatusName],
           ISNULL(CU.[FullName],N'') [CurrentUserName],ISNULL(CP.[OnvanPost],N'') [CurrentPostName],ISNULL(CU.[NameMahal],N'') [CurrentMahalName],
           CAST(CASE WHEN K.[CreateUserId]=@UserId THEN 1 ELSE 0 END AS BIT) [IsOwner],
           CAST(CASE WHEN K.[CurrentUserId]=@UserId THEN 1 ELSE 0 END AS BIT) [IsInbox],
           CAST(CASE WHEN K.[CurrentStatusCode] LIKE N'BARGASHT_%' THEN 1 ELSE 0 END AS BIT) [IsReturned],
           CAST(CASE WHEN K.[CurrentUserId]=@UserId AND EXISTS(
              SELECT 1 FROM [Akhbar].[KhabarGardeshLog] RL
              WHERE RL.[ShomareKhabar]=K.[ShomareKhabar] AND RL.[ToUserId]=@UserId
                AND RL.[NoeEghdam] IN(N'ارسال خبر',N'تأیید و ارسال')
                AND ISNULL(RL.[ActionCode],N'') NOT LIKE N'BARGASHT_%'
           ) THEN 1 ELSE 0 END AS BIT) [CanReturn],
           (SELECT TOP(1) RR.[Tozihat] FROM [Akhbar].[KhabarGardeshLog] RR
             WHERE RR.[ShomareKhabar]=K.[ShomareKhabar] AND RR.[ToUserId]=@UserId AND RR.[NoeEghdam]=N'برگشت خبر'
             ORDER BY RR.[LogId] DESC) [LastReturnReason]
    FROM [Akhbar].[Khabar] K
    LEFT JOIN [dbo].[DFN] TB ON TB.[PID]=71101 AND TRY_CAST(TB.[Value] AS BIGINT)=K.[TabaqehBandi]
    INNER JOIN [dbo].[DFN] M ON M.[ID]=K.[ManbaKhabarId] AND M.[PID]=10201
    LEFT JOIN [dbo].[DFN] NK ON NK.[PID]=71102 AND TRY_CAST(NK.[Value] AS BIGINT)=K.[NoeKhabar]
    LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N ON N.[NoghteKhabarkhizId]=K.[NoghteKhabarkhizId]
    LEFT JOIN [dbo].[Vbl_Users] CU ON CU.[UserId]=K.[CurrentUserId]
    LEFT JOIN [dbo].[Posts] CP ON CP.[PostId]=K.[CurrentPostId]
    WHERE K.[ShomareKhabar]=@ShomareKhabar AND K.[IsDelete]=0 AND
      (@IsAdmin=1 OR K.[CreateUserId]=@UserId OR K.[CurrentUserId]=@UserId OR EXISTS(
        SELECT 1 FROM [Akhbar].[KhabarGardeshLog] L WHERE L.[ShomareKhabar]=K.[ShomareKhabar] AND (L.[FromUserId]=@UserId OR L.[ToUserId]=@UserId)
      ));
END
GO

/* ---------- چرخه خبر ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarGardesh]
    @ShomareKhabar BIGINT,@UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IsAdmin BIT=0;
    IF EXISTS(SELECT 1 FROM [dbo].[Users] U INNER JOIN [dbo].[Posts] P ON P.[PostId]=U.[PostId] WHERE U.[UserId]=@UserId AND U.[IsActive]=1 AND P.[RollId]=1) SET @IsAdmin=1;

    IF NOT EXISTS(
      SELECT 1 FROM [Akhbar].[Khabar] K WHERE K.[ShomareKhabar]=@ShomareKhabar AND K.[IsDelete]=0 AND
        (@IsAdmin=1 OR K.[CreateUserId]=@UserId OR K.[CurrentUserId]=@UserId OR EXISTS(
          SELECT 1 FROM [Akhbar].[KhabarGardeshLog] L WHERE L.[ShomareKhabar]=K.[ShomareKhabar] AND (L.[FromUserId]=@UserId OR L.[ToUserId]=@UserId)))
    ) THROW 51000,N'اجازه مشاهده چرخه این خبر را ندارید.',1;

    SELECT K.[ShomareKhabar],K.[OnvanKhabar],K.[CurrentStatusCode],K.[LastActionCode],K.[StatusDateTime],
           ISNULL(V.[FullName],N'') [CurrentUserName],ISNULL(P.[OnvanPost],N'') [CurrentPostName],ISNULL(V.[NameMahal],N'') [CurrentMahalName],
           CASE K.[CurrentStatusCode]
             WHEN N'PISHNEVIS' THEN N'پیش‌نویس' WHEN N'KARTABL_NAMAYANDE_SH' THEN N'در کارتابل نماینده شهرستان'
             WHEN N'KARTABL_HOZE_TAHGHIGH' THEN N'در کارتابل مسئول اسناد و تحقیق حوزه' WHEN N'KARTABL_HOZE_RAEIS' THEN N'در کارتابل رئیس حوزه انتخابیه'
             WHEN N'KARTABL_OSTAN_KARDAN' THEN N'در کارتابل کاردان استان' WHEN N'KARTABL_OSTAN_KARSHENAS' THEN N'در کارتابل کارشناس استان'
             WHEN N'KARTABL_OSTAN_MASOOL' THEN N'در کارتابل مسئول واحد استان' WHEN N'KARTABL_OSTAN_RAEIS' THEN N'در کارتابل رئیس دفتر استان'
             WHEN N'BARGASHT_NAMAYANDE_SH' THEN N'برگشت شده به نماینده شهرستان' WHEN N'BARGASHT_HOZE_TAHGHIGH' THEN N'برگشت شده به مسئول اسناد و تحقیق حوزه'
             WHEN N'BARGASHT_HOZE_RAEIS' THEN N'برگشت شده به رئیس حوزه' WHEN N'BARGASHT_OSTAN_KARDAN' THEN N'برگشت شده به کاردان استان'
             WHEN N'BARGASHT_OSTAN_KARSHENAS' THEN N'برگشت شده به کارشناس استان' WHEN N'BARGASHT_OSTAN_MASOOL' THEN N'برگشت شده به مسئول واحد استان'
             WHEN N'BARGASHT_OSTAN_RAEIS' THEN N'برگشت شده به رئیس دفتر استان' ELSE N'در حال گردش' END [CurrentStatusName]
    FROM [Akhbar].[Khabar] K
    LEFT JOIN [dbo].[Vbl_Users] V ON V.[UserId]=K.[CurrentUserId]
    LEFT JOIN [dbo].[Posts] P ON P.[PostId]=K.[CurrentPostId]
    WHERE K.[ShomareKhabar]=@ShomareKhabar;

    SELECT * FROM (
      SELECT CAST(0 AS BIGINT) [LogId],K.[ShomareKhabar],N'ایجاد خبر' [NoeEghdam],N'IJAD_KHABAR' [ActionCode],CAST(NULL AS NVARCHAR(2000)) [Tozihat],CAST(NULL AS NVARCHAR(500)) [EshkalatIds],
             K.[CreateDateTime],K.[CreateUserId] [FromUserId],K.[CreatePostId] [FromPostId],K.[CreateMahal] [FromMahal],
             ISNULL(V.[FullName],N'') [FromUserName],ISNULL(P.[OnvanPost],N'') [FromPostName],ISNULL(V.[NameMahal],N'') [FromMahalName],
             CAST(NULL AS BIGINT) [ToUserId],CAST(NULL AS BIGINT) [ToPostId],CAST(NULL AS BIGINT) [ToMahal],N'' [ToUserName],N'' [ToPostName],N'' [ToMahalName]
      FROM [Akhbar].[Khabar] K LEFT JOIN [dbo].[Vbl_Users] V ON V.[UserId]=K.[CreateUserId] LEFT JOIN [dbo].[Posts] P ON P.[PostId]=K.[CreatePostId]
      WHERE K.[ShomareKhabar]=@ShomareKhabar
      UNION ALL
      SELECT L.[LogId],L.[ShomareKhabar],L.[NoeEghdam],ISNULL(L.[ActionCode],N''),L.[Tozihat],L.[EshkalatIds],L.[CreateDateTime],
             L.[FromUserId],L.[FromPostId],L.[FromMahal],ISNULL(FU.[FullName],N''),ISNULL(FP.[OnvanPost],N''),ISNULL(FU.[NameMahal],N''),
             L.[ToUserId],L.[ToPostId],L.[ToMahal],ISNULL(TU.[FullName],N''),ISNULL(TP.[OnvanPost],N''),ISNULL(TU.[NameMahal],N'')
      FROM [Akhbar].[KhabarGardeshLog] L
      LEFT JOIN [dbo].[Vbl_Users] FU ON FU.[UserId]=L.[FromUserId]
      LEFT JOIN [dbo].[Posts] FP ON FP.[PostId]=L.[FromPostId]
      LEFT JOIN [dbo].[Vbl_Users] TU ON TU.[UserId]=L.[ToUserId]
      LEFT JOIN [dbo].[Posts] TP ON TP.[PostId]=L.[ToPostId]
      WHERE L.[ShomareKhabar]=@ShomareKhabar
    ) X ORDER BY X.[LogId];
END
GO
