USE [MeratDB]
GO

/*
  خبر برگشتی برای گیرنده فعلی باید همزمان در دو بخش دیده شود:
  1) کارتابل: چون اقدام جاری روی خبر بر عهده اوست.
  2) برگشت‌شده: چون خبر با عملیات برگشت به او رسیده است.

  هیچ رکورد تکراری ایجاد نمی‌شود؛ فقط فیلتر نمایش باکس‌ها اصلاح می‌شود.
*/

CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarBoxCounts]
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PostId BIGINT, @Mahal BIGINT;
    SELECT @PostId=[PostId], @Mahal=[Mahal]
    FROM [dbo].[Users]
    WHERE [UserId]=@UserId AND [IsActive]=1;

    IF @PostId IS NULL
        THROW 51000,N'کاربر فعال یافت نشد.',1;

    SELECT
      (
        SELECT COUNT(*)
        FROM [Akhbar].[Khabar] K
        WHERE K.[IsDelete]=0
          AND
          (
            (K.[CurrentStatusCode]=N'PISHNEVIS' AND K.[CreateUserId]=@UserId)
            OR
            (
              K.[CurrentUserId]=@UserId
              AND K.[CurrentPostId]=@PostId
              AND K.[CurrentMahal]=@Mahal
              AND
              (
                K.[CurrentStatusCode] LIKE N'KARTABL_%'
                OR K.[CurrentStatusCode] LIKE N'BARGASHT_%'
              )
            )
          )
      ) [KartablCount],

      (
        SELECT COUNT(DISTINCT L.[ShomareKhabar])
        FROM [Akhbar].[KhabarGardeshLog] L
        INNER JOIN [Akhbar].[Khabar] K
          ON K.[ShomareKhabar]=L.[ShomareKhabar]
         AND K.[IsDelete]=0
        WHERE L.[FromUserId]=@UserId
          AND L.[FromPostId]=@PostId
          AND L.[FromMahal]=@Mahal
          AND L.[NoeEghdam] IN (N'ارسال خبر',N'تأیید و ارسال')
          AND NOT
          (
            K.[CurrentUserId]=@UserId
            AND K.[CurrentPostId]=@PostId
            AND K.[CurrentMahal]=@Mahal
          )
      ) [SentCount],

      (
        SELECT COUNT(*)
        FROM [Akhbar].[Khabar] K
        WHERE K.[IsDelete]=0
          AND K.[CurrentUserId]=@UserId
          AND K.[CurrentPostId]=@PostId
          AND K.[CurrentMahal]=@Mahal
          AND K.[CurrentStatusCode] LIKE N'BARGASHT_%'
      ) [ReturnedCount];
END
GO


CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPage]
    @UserId BIGINT,
    @Page INT,
    @SizePage INT,
    @SortIndex INT=1,
    @SECDEC INT=2,
    @Search NVARCHAR(200)=N'',
    @BoxType INT=1
AS
BEGIN
    SET NOCOUNT ON;

    IF @Page<1 SET @Page=1;
    IF @SizePage<1 SET @SizePage=20;
    IF @SizePage>100 SET @SizePage=100;
    IF @SortIndex NOT BETWEEN 1 AND 5 SET @SortIndex=1;
    IF @SECDEC NOT IN(1,2) SET @SECDEC=2;
    IF @BoxType NOT IN(1,2,3) SET @BoxType=1;

    SET @Search=[dbo].[NormalizePersianText](ISNULL(LTRIM(RTRIM(@Search)),N''));

    DECLARE @PostId BIGINT,@Mahal BIGINT;
    SELECT @PostId=[PostId],@Mahal=[Mahal]
    FROM [dbo].[Users]
    WHERE [UserId]=@UserId AND [IsActive]=1;

    IF @PostId IS NULL
        THROW 51000,N'کاربر فعال یافت نشد.',1;

    ;WITH B AS
    (
      SELECT
             K.[ShomareKhabar],
             K.[TabaqehBandi],
             TB.[NameFarsi] [TabaqehBandiName],
             K.[ManbaKhabarId],
             M.[NameFarsi] [ManbaKhabarName],
             K.[NoeKhabar],
             NK.[NameFarsi] [NoeKhabarName],
             K.[TarikhNameh],
             K.[ShomareNameh],
             K.[OnvanKhabar],
             K.[TarikhEnteshar],
             K.[CreateDateTime],
             K.[LastEditDateTime],
             K.[CreateUserId],
             K.[CreatePostId],
             K.[CreateMahal],
             K.[CurrentStatusCode],
             K.[LastActionCode],
             K.[CurrentUserId],
             K.[CurrentPostId],
             K.[CurrentMahal],
             K.[StatusDateTime],
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
               ELSE N'در حال گردش'
             END [CurrentStatusName],
             ISNULL(CU.[FullName],N'') [CurrentUserName],
             ISNULL(CP.[OnvanPost],N'') [CurrentPostName],
             ISNULL(CU.[NameMahal],N'') [CurrentMahalName],
             CAST(CASE WHEN K.[CreateUserId]=@UserId THEN 1 ELSE 0 END AS BIT) [IsOwner],
             CAST(CASE
                    WHEN K.[CurrentUserId]=@UserId
                     AND K.[CurrentPostId]=@PostId
                     AND K.[CurrentMahal]=@Mahal
                    THEN 1 ELSE 0
                  END AS BIT) [IsInbox],
             LS.[LastSendDateTime]
      FROM [Akhbar].[Khabar] K
      INNER JOIN [dbo].[DFN] M
        ON M.[ID]=K.[ManbaKhabarId]
       AND M.[PID]=10201
      LEFT JOIN [dbo].[DFN] TB
        ON TB.[PID]=71101
       AND TRY_CAST(TB.[Value] AS BIGINT)=K.[TabaqehBandi]
      LEFT JOIN [dbo].[DFN] NK
        ON NK.[PID]=71102
       AND TRY_CAST(NK.[Value] AS BIGINT)=K.[NoeKhabar]
      LEFT JOIN [dbo].[Vbl_Users] CU
        ON CU.[UserId]=K.[CurrentUserId]
      LEFT JOIN [dbo].[Posts] CP
        ON CP.[PostId]=K.[CurrentPostId]
      OUTER APPLY
      (
        SELECT TOP(1) L.[CreateDateTime] [LastSendDateTime]
        FROM [Akhbar].[KhabarGardeshLog] L
        WHERE L.[ShomareKhabar]=K.[ShomareKhabar]
          AND L.[FromUserId]=@UserId
          AND L.[FromPostId]=@PostId
          AND L.[FromMahal]=@Mahal
          AND L.[NoeEghdam] IN(N'ارسال خبر',N'تأیید و ارسال')
        ORDER BY L.[LogId] DESC
      ) LS
      WHERE K.[IsDelete]=0
        AND
        (
          /* کارتابل: پیش‌نویس‌های خود کاربر + خبرهای جاری + خبرهای برگشتی به خود کاربر */
          (
            @BoxType=1
            AND
            (
              (K.[CurrentStatusCode]=N'PISHNEVIS' AND K.[CreateUserId]=@UserId)
              OR
              (
                K.[CurrentUserId]=@UserId
                AND K.[CurrentPostId]=@PostId
                AND K.[CurrentMahal]=@Mahal
                AND
                (
                  K.[CurrentStatusCode] LIKE N'KARTABL_%'
                  OR K.[CurrentStatusCode] LIKE N'BARGASHT_%'
                )
              )
            )
          )

          OR

          /* ارسال‌شده */
          (
            @BoxType=2
            AND LS.[LastSendDateTime] IS NOT NULL
            AND NOT
            (
              K.[CurrentUserId]=@UserId
              AND K.[CurrentPostId]=@PostId
              AND K.[CurrentMahal]=@Mahal
            )
          )

          OR

          /* برگشت‌شده: همان خبرهای برگشتی که اکنون در اختیار همین کاربر هستند */
          (
            @BoxType=3
            AND K.[CurrentUserId]=@UserId
            AND K.[CurrentPostId]=@PostId
            AND K.[CurrentMahal]=@Mahal
            AND K.[CurrentStatusCode] LIKE N'BARGASHT_%'
          )
        )
        AND
        (
          @Search=N''
          OR [dbo].[NormalizePersianText](K.[OnvanKhabar]) LIKE N'%'+@Search+N'%'
          OR [dbo].[NormalizePersianText](ISNULL(K.[ShomareNameh],N'')) LIKE N'%'+@Search+N'%'
          OR [dbo].[NormalizePersianText](M.[NameFarsi]) LIKE N'%'+@Search+N'%'
          OR CAST(K.[ShomareKhabar] AS NVARCHAR(30)) LIKE N'%'+@Search+N'%'
        )
    )
    SELECT
      ROW_NUMBER() OVER
      (
        ORDER BY
          CASE WHEN @SortIndex=1 AND @SECDEC=1 THEN [ShomareKhabar] END ASC,
          CASE WHEN @SortIndex=1 AND @SECDEC=2 THEN [ShomareKhabar] END DESC,
          CASE WHEN @SortIndex=2 AND @SECDEC=1 THEN [OnvanKhabar] END ASC,
          CASE WHEN @SortIndex=2 AND @SECDEC=2 THEN [OnvanKhabar] END DESC,
          CASE WHEN @SortIndex=5 AND @SECDEC=1 THEN [CreateDateTime] END ASC,
          CASE WHEN @SortIndex=5 AND @SECDEC=2 THEN [CreateDateTime] END DESC,
          [ShomareKhabar] DESC
      ) [Rdf],
      *,
      (SELECT COUNT(*) FROM B) [TotalCount]
    FROM B
    ORDER BY
      CASE WHEN @SortIndex=1 AND @SECDEC=1 THEN [ShomareKhabar] END ASC,
      CASE WHEN @SortIndex=1 AND @SECDEC=2 THEN [ShomareKhabar] END DESC,
      CASE WHEN @SortIndex=2 AND @SECDEC=1 THEN [OnvanKhabar] END ASC,
      CASE WHEN @SortIndex=2 AND @SECDEC=2 THEN [OnvanKhabar] END DESC,
      CASE WHEN @SortIndex=5 AND @SECDEC=1 THEN [CreateDateTime] END ASC,
      CASE WHEN @SortIndex=5 AND @SECDEC=2 THEN [CreateDateTime] END DESC,
      [ShomareKhabar] DESC
    OFFSET (@Page-1)*@SizePage ROWS
    FETCH NEXT @SizePage ROWS ONLY;
END
GO
