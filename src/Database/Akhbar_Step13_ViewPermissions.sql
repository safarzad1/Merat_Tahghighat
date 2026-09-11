USE [MeratDB];
GO

/* ============================================================
   مرحله 13 اخبار - اصلاح مجوز مشاهده خبرهای ارسال‌شده
   هدف:
   - ایجادکننده خبر
   - صاحب فعلی کارتابل
   - هر کاربری که قبلاً در گردش خبر فرستنده یا گیرنده بوده
   - مدیران ستاد (RollId = 1)
   بتوانند اطلاعات وابستگان و پیوست‌های خبر را مشاهده کنند.
   این اسکریپت هیچ مجوزی برای ویرایش/تأیید/برگشت اضافه نمی‌کند.
   ============================================================ */

CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarAshkhas]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IsAdmin BIT = 0;

    IF EXISTS
    (
        SELECT 1
        FROM [dbo].[Users] U
        INNER JOIN [dbo].[Posts] P ON P.[PostId] = U.[PostId]
        WHERE U.[UserId] = @UserId
          AND U.[IsActive] = 1
          AND P.[RollId] = 1
    )
        SET @IsAdmin = 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND
          (
              @IsAdmin = 1
              OR K.[CreateUserId] = @UserId
              OR K.[CurrentUserId] = @UserId
              OR EXISTS
              (
                  SELECT 1
                  FROM [Akhbar].[KhabarGardeshLog] L
                  WHERE L.[ShomareKhabar] = K.[ShomareKhabar]
                    AND (L.[FromUserId] = @UserId OR L.[ToUserId] = @UserId)
              )
          )
    )
        THROW 51000, N'اجازه مشاهده اشخاص وابسته این خبر را ندارید.', 1;

    SELECT
        KA.[KhabarShakhsId],
        KA.[ShomarehParvandeh],
        A.[FirstName],
        A.[LastName],
        A.[NamePedar],
        KA.[CreateDateTime]
    FROM [Akhbar].[KhabarAshkhas] KA
    INNER JOIN [Davtalab].[Ashkhas] A
        ON A.[ShomarehParvandeh] = KA.[ShomarehParvandeh]
    WHERE KA.[ShomareKhabar] = @ShomareKhabar
      AND KA.[IsDelete] = 0
    ORDER BY KA.[KhabarShakhsId] DESC;
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPeyvastha]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IsAdmin BIT = 0;

    IF EXISTS
    (
        SELECT 1
        FROM [dbo].[Users] U
        INNER JOIN [dbo].[Posts] P ON P.[PostId] = U.[PostId]
        WHERE U.[UserId] = @UserId
          AND U.[IsActive] = 1
          AND P.[RollId] = 1
    )
        SET @IsAdmin = 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND
          (
              @IsAdmin = 1
              OR K.[CreateUserId] = @UserId
              OR K.[CurrentUserId] = @UserId
              OR EXISTS
              (
                  SELECT 1
                  FROM [Akhbar].[KhabarGardeshLog] L
                  WHERE L.[ShomareKhabar] = K.[ShomareKhabar]
                    AND (L.[FromUserId] = @UserId OR L.[ToUserId] = @UserId)
              )
          )
    )
        THROW 51000, N'اجازه مشاهده پیوست‌های این خبر را ندارید.', 1;

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

    DECLARE @IsAdmin BIT = 0;

    IF EXISTS
    (
        SELECT 1
        FROM [dbo].[Users] U
        INNER JOIN [dbo].[Posts] P ON P.[PostId] = U.[PostId]
        WHERE U.[UserId] = @UserId
          AND U.[IsActive] = 1
          AND P.[RollId] = 1
    )
        SET @IsAdmin = 1;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Akhbar].[Khabar] K
        WHERE K.[ShomareKhabar] = @ShomareKhabar
          AND K.[IsDelete] = 0
          AND
          (
              @IsAdmin = 1
              OR K.[CreateUserId] = @UserId
              OR K.[CurrentUserId] = @UserId
              OR EXISTS
              (
                  SELECT 1
                  FROM [Akhbar].[KhabarGardeshLog] L
                  WHERE L.[ShomareKhabar] = K.[ShomareKhabar]
                    AND (L.[FromUserId] = @UserId OR L.[ToUserId] = @UserId)
              )
          )
    )
        THROW 51000, N'اجازه مشاهده فایل پیوست این خبر را ندارید.', 1;

    SELECT TOP (1)
        PF.[FileName],
        PF.[Files],
        PF.[FileSize]
    FROM [Akhbar].[KhabarPeyvast] KP
    INNER JOIN [MeratFilesDB].[dbo].[PeyvastFiles] PF
        ON PF.[FileName] = KP.[FileName]
    WHERE KP.[ShomareKhabar] = @ShomareKhabar
      AND KP.[FileName] = @FileName;
END
GO
