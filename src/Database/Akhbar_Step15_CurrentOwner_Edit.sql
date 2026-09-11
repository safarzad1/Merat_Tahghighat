USE [MeratDB];
GO

/* ============================================================
   مرحله 15 اخبار - مجوز ویرایش فقط برای صاحب فعلی کارتابل

   قاعده:
   - پیش‌نویس: فقط ایجادکننده خبر.
   - خبر ارسال‌شده: مبدأ قبلی فقط مشاهده؛ ویرایش ندارد.
   - خبر در کارتابل سطح جدید: صاحب فعلی کارتابل امکان ویرایش دارد.
   - خبر برگشتی برای اصلاح: گیرنده برگشت چون صاحب فعلی کارتابل است امکان ویرایش دارد.
   ============================================================ */

CREATE OR ALTER FUNCTION [Akhbar].[FN_CanEditKhabar]
(
    @ShomareKhabar BIGINT,
    @UserId BIGINT
)
RETURNS BIT
AS
BEGIN
    DECLARE @Result BIT = 0;

    IF EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        INNER JOIN [dbo].[Users] U
            ON U.[UserId] = @UserId
           AND U.[IsActive] = 1
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND K.[CurrentUserId] = @UserId
          AND K.[CurrentPostId] = U.[PostId]
          AND K.[CurrentMahal] = U.[Mahal]
          AND
          (
              (K.[CurrentStatusCode] = N'PISHNEVIS' AND K.[CreateUserId] = @UserId)
              OR K.[CurrentStatusCode] LIKE N'KARTABL_%'
              OR K.[CurrentStatusCode] LIKE N'BARGASHT_%'
          )
    )
        SET @Result = 1;

    RETURN @Result;
END
GO

/* ---------- ویرایش مشخصات اصلی خبر ---------- */
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

    IF [Akhbar].[FN_CanEditKhabar](@ShomareKhabar, @LastEditUserId) = 0
        THROW 51000, N'خبر در کارتابل شما نیست و امکان ویرایش آن را ندارید.', 1;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[DFN] WHERE [ID] = @ManbaKhabarId AND [PID] = 10201)
        THROW 51000, N'منبع خبر معتبر نیست.', 1;

    /* در ویرایش سطوح بالاتر، نقطه خبرخیز محل مبدأ باید قابل حفظ باشد. */
    IF @NoghteKhabarkhizId IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM [Akhbar].[NoghatKhabarkhiz]
           WHERE [NoghteKhabarkhizId] = @NoghteKhabarkhizId
             AND [IsActive] = 1
       )
        THROW 51000, N'نقطه خبرخیز معتبر نیست.', 1;

    IF NULLIF(LTRIM(RTRIM(@OnvanKhabar)), N'') IS NULL
        THROW 51000, N'عنوان خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@SharhKhabar)), N'') IS NULL
        THROW 51000, N'شرح خبر اجباری است.', 1;

    IF NULLIF(LTRIM(RTRIM(@MolahazatKhabar)), N'') IS NULL
        THROW 51000, N'ملاحظات خبر اجباری است.', 1;

    IF @NoghteKhabarkhizId IS NULL
       AND NULLIF(LTRIM(RTRIM(@MahalNoghteKhabarkhiz)), N'') IS NULL
        THROW 51000, N'در صورت عدم انتخاب نقطه خبرخیز، درج محل نقطه خبرخیز اجباری است.', 1;

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
      AND [IsDelete] = 0;

    SELECT @ShomareKhabar AS [ShomareKhabar];
END
GO

/* ---------- جستجوی شخص فقط زمانی که خبر قابل ویرایش است ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_SearchAshkhas]
    @ShomareKhabar BIGINT,
    @UserId BIGINT,
    @Search NVARCHAR(150),
    @Page INT = 1,
    @SizePage INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF [Akhbar].[FN_CanEditKhabar](@ShomareKhabar, @UserId) = 0
        THROW 51000, N'خبر در کارتابل شما نیست و امکان اصلاح اشخاص وابسته را ندارید.', 1;

    SET @Page = CASE WHEN ISNULL(@Page,0) < 1 THEN 1 ELSE @Page END;
    SET @SizePage = CASE WHEN ISNULL(@SizePage,0) < 1 THEN 10 WHEN @SizePage > 50 THEN 50 ELSE @SizePage END;
    SET @Search = LTRIM(RTRIM([dbo].[NormalizePersianText](ISNULL(@Search,N''))));

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

    DECLARE @Tokens TABLE ([Token] NVARCHAR(100) NOT NULL PRIMARY KEY);
    INSERT INTO @Tokens([Token])
    SELECT DISTINCT LTRIM(RTRIM([value]))
    FROM STRING_SPLIT(@Search,N' ')
    WHERE LEN(LTRIM(RTRIM([value]))) > 0;

    ;WITH Q AS
    (
        SELECT A.[ShomarehParvandeh],A.[FirstName],A.[LastName],A.[NamePedar]
        FROM [Davtalab].[Ashkhas] A
        WHERE ISNULL(A.[IsDelete],0)=0
          AND NOT EXISTS
          (
              SELECT 1
              FROM @Tokens T
              WHERE NOT
              (
                     A.[FirstName] LIKE T.[Token] + N'%'
                  OR A.[LastName]  LIKE T.[Token] + N'%'
                  OR A.[NamePedar] LIKE T.[Token] + N'%'
              )
          )
          AND NOT EXISTS
          (
              SELECT 1 FROM [Akhbar].[KhabarAshkhas] KA
              WHERE KA.[ShomareKhabar]=@ShomareKhabar
                AND KA.[ShomarehParvandeh]=A.[ShomarehParvandeh]
                AND KA.[IsDelete]=0
          )
    )
    SELECT Q.[ShomarehParvandeh],Q.[FirstName],Q.[LastName],Q.[NamePedar],COUNT_BIG(1) OVER() [TotalCount]
    FROM Q
    ORDER BY Q.[LastName],Q.[FirstName],Q.[NamePedar],Q.[ShomarehParvandeh]
    OFFSET (@Page-1)*@SizePage ROWS FETCH NEXT @SizePage ROWS ONLY
    OPTION (RECOMPILE);
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

    IF [Akhbar].[FN_CanEditKhabar](@ShomareKhabar, @CreateUserId) = 0
        THROW 51000, N'خبر در کارتابل شما نیست و امکان اصلاح اشخاص وابسته را ندارید.', 1;

    IF NOT EXISTS
    (
        SELECT 1 FROM [Davtalab].[Ashkhas]
        WHERE [ShomarehParvandeh]=@ShomarehParvandeh
          AND ISNULL([IsDelete],0)=0
    )
        THROW 51000, N'شخص مورد نظر یافت نشد.', 1;

    BEGIN TRAN;

    IF EXISTS
    (
        SELECT 1 FROM [Akhbar].[KhabarAshkhas]
        WHERE [ShomareKhabar]=@ShomareKhabar
          AND [ShomarehParvandeh]=@ShomarehParvandeh
          AND [IsDelete]=1
    )
    BEGIN
        UPDATE [Akhbar].[KhabarAshkhas]
        SET [IsDelete]=0,
            [LastEditUserId]=@CreateUserId,
            [LastEditDateTime]=[dbo].[FarsiDateTimeNow]()
        WHERE [ShomareKhabar]=@ShomareKhabar
          AND [ShomarehParvandeh]=@ShomarehParvandeh
          AND [IsDelete]=1;
    END
    ELSE IF NOT EXISTS
    (
        SELECT 1 FROM [Akhbar].[KhabarAshkhas]
        WHERE [ShomareKhabar]=@ShomareKhabar
          AND [ShomarehParvandeh]=@ShomarehParvandeh
          AND [IsDelete]=0
    )
    BEGIN
        INSERT INTO [Akhbar].[KhabarAshkhas]
            ([ShomareKhabar],[ShomarehParvandeh],[IsDelete],[CreateUserId],[CreateDateTime])
        VALUES
            (@ShomareKhabar,@ShomarehParvandeh,0,@CreateUserId,[dbo].[FarsiDateTimeNow]());
    END;

    COMMIT;

    SELECT TOP (1)
        KA.[KhabarShakhsId],KA.[ShomarehParvandeh],A.[FirstName],A.[LastName],A.[NamePedar]
    FROM [Akhbar].[KhabarAshkhas] KA
    INNER JOIN [Davtalab].[Ashkhas] A ON A.[ShomarehParvandeh]=KA.[ShomarehParvandeh]
    WHERE KA.[ShomareKhabar]=@ShomareKhabar
      AND KA.[ShomarehParvandeh]=@ShomarehParvandeh
      AND KA.[IsDelete]=0;
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_DeleteKhabarShakhs]
    @KhabarShakhsId BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ShomareKhabar BIGINT;
    SELECT @ShomareKhabar=[ShomareKhabar]
    FROM [Akhbar].[KhabarAshkhas]
    WHERE [KhabarShakhsId]=@KhabarShakhsId AND [IsDelete]=0;

    IF @ShomareKhabar IS NULL OR [Akhbar].[FN_CanEditKhabar](@ShomareKhabar,@UserId)=0
        THROW 51000, N'امکان حذف این شخص از خبر را ندارید.', 1;

    UPDATE [Akhbar].[KhabarAshkhas]
    SET [IsDelete]=1,
        [LastEditUserId]=@UserId,
        [LastEditDateTime]=[dbo].[FarsiDateTimeNow]()
    WHERE [KhabarShakhsId]=@KhabarShakhsId AND [IsDelete]=0;

    SELECT CAST(1 AS BIT) AS [IsDeleted];
END
GO

/* ---------- پیوست‌ها ---------- */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_InsertKhabarPeyvast]
    @ShomareKhabar BIGINT,
    @FileName NVARCHAR(250),
    @OriginalFileName NVARCHAR(500),
    @Files VARBINARY(MAX),
    @FileSize INT,
    @CreateUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF [Akhbar].[FN_CanEditKhabar](@ShomareKhabar,@CreateUserId)=0
        THROW 51000, N'خبر در کارتابل شما نیست و امکان افزودن پیوست را ندارید.', 1;

    IF NULLIF(LTRIM(RTRIM(@FileName)),N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@OriginalFileName)),N'') IS NULL
       OR @Files IS NULL OR @FileSize<=0
        THROW 51000, N'اطلاعات فایل معتبر نیست.', 1;

    IF EXISTS (SELECT 1 FROM [MeratFilesDB].[dbo].[PeyvastFiles] WHERE [FileName]=@FileName)
        THROW 51000, N'نام فایل تکراری است.', 1;

    BEGIN TRAN;

    INSERT INTO [MeratFilesDB].[dbo].[PeyvastFiles]
        ([FileName],[Files],[FileSize],[CreateDateTime])
    VALUES
        (@FileName,@Files,@FileSize,[dbo].[FarsiDateTimeNow]());

    INSERT INTO [Akhbar].[KhabarPeyvast]
        ([ShomareKhabar],[FileName],[OriginalFileName],[CreateUserId],[CreateDateTime])
    VALUES
        (@ShomareKhabar,@FileName,LTRIM(RTRIM(@OriginalFileName)),@CreateUserId,[dbo].[FarsiDateTimeNow]());

    DECLARE @KhabarPeyvastId BIGINT=SCOPE_IDENTITY();
    COMMIT;

    SELECT @KhabarPeyvastId [KhabarPeyvastId],@ShomareKhabar [ShomareKhabar],@FileName [FileName],LTRIM(RTRIM(@OriginalFileName)) [OriginalFileName],@FileSize [FileSize];
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_DeleteKhabarPeyvast]
    @KhabarPeyvastId BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @FileName NVARCHAR(250),@ShomareKhabar BIGINT;

    SELECT @FileName=[FileName],@ShomareKhabar=[ShomareKhabar]
    FROM [Akhbar].[KhabarPeyvast]
    WHERE [KhabarPeyvastId]=@KhabarPeyvastId;

    IF @FileName IS NULL OR @ShomareKhabar IS NULL
        THROW 51000, N'پیوست یافت نشد.', 1;

    IF [Akhbar].[FN_CanEditKhabar](@ShomareKhabar,@UserId)=0
        THROW 51000, N'خبر در کارتابل شما نیست و امکان حذف پیوست را ندارید.', 1;

    BEGIN TRAN;

    DELETE FROM [Akhbar].[KhabarPeyvast]
    WHERE [KhabarPeyvastId]=@KhabarPeyvastId;

    DELETE FROM [MeratFilesDB].[dbo].[PeyvastFiles]
    WHERE [FileName]=@FileName;

    COMMIT;

    SELECT 1 [Status],@FileName [FileName];
END
GO
